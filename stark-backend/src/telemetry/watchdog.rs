//! Timeout guards on individual tool calls and LLM calls.
//!
//! Heartbeat monitoring detects unresponsive executions.
//! Integrates with rollout retry on timeout.

use std::future::Future;
use std::sync::Arc;
use std::time::Duration;

use chrono::Utc;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tokio::time::timeout;

use super::reward::RewardEmitter;
use super::span::{SpanCollector, SpanType};

/// Configuration for the watchdog.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchdogConfig {
    /// Default timeout for tool executions in seconds
    pub tool_timeout_secs: u64,
    /// Default timeout for LLM calls in seconds
    pub llm_timeout_secs: u64,
    /// Heartbeat interval for long-running operations in seconds
    pub heartbeat_interval_secs: u64,
    /// Maximum time without a heartbeat before marking as unresponsive (seconds)
    pub heartbeat_max_silence_secs: u64,
    /// Per-tool timeout overrides (tool_name → timeout_secs)
    pub tool_overrides: std::collections::HashMap<String, u64>,
}

impl Default for WatchdogConfig {
    fn default() -> Self {
        let mut tool_overrides = std::collections::HashMap::new();
        // web_fetch and exec can be slow
        tool_overrides.insert("web_fetch".to_string(), 120);
        tool_overrides.insert("exec".to_string(), 300);
        tool_overrides.insert("x402_fetch".to_string(), 120);
        tool_overrides.insert("deploy".to_string(), 600);

        Self {
            tool_timeout_secs: 60,
            llm_timeout_secs: 180,
            heartbeat_interval_secs: 30,
            heartbeat_max_silence_secs: 120,
            tool_overrides,
        }
    }
}

impl WatchdogConfig {
    /// Get the timeout for a specific tool, with override support.
    pub fn timeout_for_tool(&self, tool_name: &str) -> Duration {
        let secs = self
            .tool_overrides
            .get(tool_name)
            .copied()
            .unwrap_or(self.tool_timeout_secs);
        Duration::from_secs(secs)
    }

    /// Get the timeout for LLM calls.
    pub fn timeout_for_llm(&self) -> Duration {
        Duration::from_secs(self.llm_timeout_secs)
    }
}

/// Error type for watchdog-guarded operations.
#[derive(Debug)]
pub enum WatchdogError<E> {
    /// The operation timed out
    Timeout {
        operation: String,
        timeout_ms: u64,
    },
    /// The underlying operation returned an error
    Inner(E),
}

impl<E: std::fmt::Display> std::fmt::Display for WatchdogError<E> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WatchdogError::Timeout { operation, timeout_ms } => {
                write!(f, "Watchdog timeout: {} exceeded {}ms", operation, timeout_ms)
            }
            WatchdogError::Inner(e) => write!(f, "{}", e),
        }
    }
}

/// Watchdog enforces timeouts on tool and LLM calls.
pub struct Watchdog {
    config: WatchdogConfig,
    collector: Arc<SpanCollector>,
    reward_emitter: Arc<RewardEmitter>,
    /// Tracks the last heartbeat time for the current execution
    last_heartbeat: Arc<Mutex<chrono::DateTime<Utc>>>,
}

impl Watchdog {
    pub fn new(
        config: WatchdogConfig,
        collector: Arc<SpanCollector>,
        reward_emitter: Arc<RewardEmitter>,
    ) -> Self {
        Self {
            config,
            collector,
            reward_emitter,
            last_heartbeat: Arc::new(Mutex::new(Utc::now())),
        }
    }

    /// Record a heartbeat indicating the execution is still alive.
    pub fn heartbeat(&self) {
        *self.last_heartbeat.lock() = Utc::now();
    }

    /// Check if the execution has gone silent (no heartbeat in too long).
    pub fn is_unresponsive(&self) -> bool {
        let last = *self.last_heartbeat.lock();
        let silence = (Utc::now() - last).num_seconds();
        silence > self.config.heartbeat_max_silence_secs as i64
    }

    /// Guard a tool execution with a timeout.
    ///
    /// Returns the tool result on success, or a `WatchdogError::Timeout` if the
    /// operation exceeds the configured timeout for the given tool.
    pub async fn guard_tool<F, T, E>(
        &self,
        tool_name: &str,
        fut: F,
    ) -> Result<T, WatchdogError<E>>
    where
        F: Future<Output = Result<T, E>>,
    {
        let tool_timeout = self.config.timeout_for_tool(tool_name);
        let timeout_ms = tool_timeout.as_millis() as u64;

        // Start a watchdog span
        let mut span = self.collector.start_span(SpanType::Watchdog, format!("guard_tool:{}", tool_name));
        span.attributes = json!({
            "tool_name": tool_name,
            "timeout_ms": timeout_ms,
        });

        self.heartbeat();

        match timeout(tool_timeout, fut).await {
            Ok(Ok(result)) => {
                span.succeed();
                self.collector.record(span);
                self.heartbeat();
                Ok(result)
            }
            Ok(Err(e)) => {
                span.fail(format!("Tool error: {}", std::any::type_name::<E>()));
                self.collector.record(span);
                self.heartbeat();
                Err(WatchdogError::Inner(e))
            }
            Err(_elapsed) => {
                span.timeout();
                self.collector.record(span);
                self.reward_emitter.watchdog_timeout(tool_name, timeout_ms);
                log::warn!(
                    "[WATCHDOG] Tool '{}' timed out after {}ms",
                    tool_name,
                    timeout_ms
                );
                Err(WatchdogError::Timeout {
                    operation: format!("tool:{}", tool_name),
                    timeout_ms,
                })
            }
        }
    }

    /// Guard an LLM call with a timeout.
    pub async fn guard_llm<F, T, E>(
        &self,
        model_name: &str,
        fut: F,
    ) -> Result<T, WatchdogError<E>>
    where
        F: Future<Output = Result<T, E>>,
    {
        let llm_timeout = self.config.timeout_for_llm();
        let timeout_ms = llm_timeout.as_millis() as u64;

        let mut span = self.collector.start_span(SpanType::Watchdog, format!("guard_llm:{}", model_name));
        span.attributes = json!({
            "model": model_name,
            "timeout_ms": timeout_ms,
        });

        self.heartbeat();

        match timeout(llm_timeout, fut).await {
            Ok(Ok(result)) => {
                span.succeed();
                self.collector.record(span);
                self.heartbeat();
                Ok(result)
            }
            Ok(Err(e)) => {
                span.fail("LLM error".to_string());
                self.collector.record(span);
                self.heartbeat();
                Err(WatchdogError::Inner(e))
            }
            Err(_elapsed) => {
                span.timeout();
                self.collector.record(span);
                self.reward_emitter.watchdog_timeout(model_name, timeout_ms);
                log::warn!(
                    "[WATCHDOG] LLM call '{}' timed out after {}ms",
                    model_name,
                    timeout_ms
                );
                Err(WatchdogError::Timeout {
                    operation: format!("llm:{}", model_name),
                    timeout_ms,
                })
            }
        }
    }

    /// Start a background heartbeat monitor task.
    ///
    /// Returns a JoinHandle that can be used to cancel the monitor.
    pub fn start_heartbeat_monitor(
        self: &Arc<Self>,
        channel_id: i64,
        broadcaster: Arc<crate::gateway::events::EventBroadcaster>,
    ) -> tokio::task::JoinHandle<()> {
        let watchdog = Arc::clone(self);
        let interval = Duration::from_secs(watchdog.config.heartbeat_interval_secs);

        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(interval);
            ticker.tick().await; // skip first immediate tick

            loop {
                ticker.tick().await;

                if watchdog.is_unresponsive() {
                    log::warn!(
                        "[WATCHDOG] Channel {} execution appears unresponsive (no heartbeat)",
                        channel_id
                    );
                    broadcaster.broadcast(crate::gateway::protocol::GatewayEvent::agent_error(
                        channel_id,
                        "Execution may be unresponsive. Monitoring...",
                    ));
                }

                // Touch heartbeat to acknowledge we checked
                watchdog.heartbeat();
            }
        })
    }
}
