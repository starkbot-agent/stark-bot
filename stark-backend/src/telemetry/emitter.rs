//! Lightweight emit API for rewards, annotations, and messages.
//!
//! Provides thread-local access to the active SpanCollector so that
//! any code path can emit telemetry without explicit plumbing.

use serde_json::{json, Value};
use std::cell::RefCell;
use std::sync::Arc;

use super::span::{SpanCollector, SpanType};

thread_local! {
    /// The active SpanCollector for the current async task.
    /// Set at the start of a dispatch and cleared at the end.
    static ACTIVE_COLLECTOR: RefCell<Option<Arc<SpanCollector>>> = const { RefCell::new(None) };
}

/// Install a SpanCollector as the active collector for the current thread.
pub fn set_active_collector(collector: Arc<SpanCollector>) {
    ACTIVE_COLLECTOR.with(|c| {
        *c.borrow_mut() = Some(collector);
    });
}

/// Remove the active collector from the current thread.
pub fn clear_active_collector() {
    ACTIVE_COLLECTOR.with(|c| {
        *c.borrow_mut() = None;
    });
}

/// Get a reference to the active collector, if one is set.
pub fn with_active_collector<F, R>(f: F) -> Option<R>
where
    F: FnOnce(&Arc<SpanCollector>) -> R,
{
    ACTIVE_COLLECTOR.with(|c| {
        c.borrow().as_ref().map(f)
    })
}

/// Emit a reward signal with a numeric value and optional attributes.
///
/// Rewards are recorded as spans of type `Reward` and can be queried
/// to analyze agent performance over time.
pub fn emit_reward(name: &str, value: f64, attrs: Value) {
    with_active_collector(|collector| {
        let mut span = collector.start_span(SpanType::Reward, name);
        span.attributes = json!({
            "reward_value": value,
            "reward_name": name,
            "extra": attrs,
        });
        span.succeed();
        collector.record(span);
    });
}

/// Emit an annotation (key-value metadata) attached to the current execution.
pub fn emit_annotation(key: &str, value: Value) {
    with_active_collector(|collector| {
        let mut span = collector.start_span(SpanType::Annotation, key);
        span.attributes = json!({
            "annotation_key": key,
            "annotation_value": value,
        });
        span.succeed();
        collector.record(span);
    });
}

/// Emit a free-text message as an annotation.
pub fn emit_message(text: &str) {
    emit_annotation("message", json!(text));
}

/// Emit a tool execution reward based on success/failure.
pub fn emit_tool_reward(tool_name: &str, success: bool, duration_ms: u64) {
    let value = if success { 1.0 } else { -0.5 };
    emit_reward(
        &format!("tool_{}", if success { "success" } else { "failure" }),
        value,
        json!({
            "tool_name": tool_name,
            "success": success,
            "duration_ms": duration_ms,
        }),
    );
}
