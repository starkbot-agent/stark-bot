//! Discord Hooks - Self-contained module for Discord command handling
//!
//! This module provides:
//! - Admin command detection and forwarding to the agent
//! - Limited command handling for regular users (register, status, help)
//! - Discord user profile management with public address registration
//! - Tool for resolving Discord mentions to registered public addresses

pub mod commands;
pub mod config;
pub mod db;
pub mod tools;

use serenity::all::{Context, Message, UserId};

pub use config::DiscordHooksConfig;
pub use db::DiscordUserProfile;

/// Result of processing a Discord message
#[derive(Debug)]
pub struct ProcessResult {
    /// Whether the module handled the message
    pub handled: bool,
    /// Direct response to send (if handled internally)
    pub response: Option<String>,
    /// Request to forward to the agent (if admin command)
    pub forward_to_agent: Option<ForwardRequest>,
}

impl ProcessResult {
    /// Message was not handled (bot not mentioned, etc.)
    pub fn not_handled() -> Self {
        Self {
            handled: false,
            response: None,
            forward_to_agent: None,
        }
    }

    /// Message was handled with a direct response
    pub fn handled(response: String) -> Self {
        Self {
            handled: true,
            response: Some(response),
            forward_to_agent: None,
        }
    }

    /// Message should be forwarded to the agent
    pub fn forward_to_agent(request: ForwardRequest) -> Self {
        Self {
            handled: true,
            response: None,
            forward_to_agent: Some(request),
        }
    }
}

/// Request to forward a message to the agent dispatcher
#[derive(Debug, Clone)]
pub struct ForwardRequest {
    /// Command text (bot mention removed)
    pub text: String,
    /// Discord user ID
    pub user_id: String,
    /// Discord username
    pub user_name: String,
    /// Whether the user is an admin
    pub is_admin: bool,
}

/// Check if the bot is mentioned in a message
pub fn is_bot_mentioned(msg: &Message, bot_id: UserId) -> bool {
    msg.mentions.iter().any(|u| u.id == bot_id)
}

/// Extract command text from a message, removing bot mentions
pub fn extract_command_text(content: &str, bot_id: UserId) -> String {
    // Remove <@BOT_ID> and <@!BOT_ID> patterns
    let bot_mention = format!("<@{}>", bot_id);
    let bot_mention_nick = format!("<@!{}>", bot_id);

    content
        .replace(&bot_mention, "")
        .replace(&bot_mention_nick, "")
        .trim()
        .to_string()
}

/// Process a Discord message through the hooks system
///
/// Returns a ProcessResult indicating how to handle the message:
/// - `handled: false` - Bot not mentioned, fall through to existing behavior
/// - `handled: true` with `response` - Send the response directly
/// - `handled: true` with `forward_to_agent` - Forward to agent dispatcher
pub async fn process(
    msg: &Message,
    ctx: &Context,
    db: &crate::db::Database,
    config: &DiscordHooksConfig,
) -> Result<ProcessResult, String> {
    // Get bot's user ID by fetching current user info
    let current_user = ctx
        .http
        .get_current_user()
        .await
        .map_err(|e| format!("Failed to get current user: {}", e))?;
    let bot_id = current_user.id;

    // Check if bot is mentioned
    if !is_bot_mentioned(msg, bot_id) {
        // In DMs, we might want to process without mention
        // For now, require mention in all contexts
        return Ok(ProcessResult::not_handled());
    }

    // Extract command text (remove bot mention)
    let command_text = extract_command_text(&msg.content, bot_id);

    if command_text.is_empty() {
        return Ok(ProcessResult::handled(
            "Hi! I'm StarkBot. Try `@starkbot help` to see available commands.".to_string(),
        ));
    }

    // Get user info
    let user_id = msg.author.id.to_string();
    let user_name = msg.author.name.clone();

    // Get or create user profile
    if let Err(e) = db::get_or_create_profile(db, &user_id, &user_name) {
        log::error!("Discord hooks: Failed to get/create profile: {}", e);
        // Don't fail the whole request, just log it
    }

    // Check if user is admin
    let is_admin = config.is_admin(&user_id);

    log::info!(
        "Discord hooks: Processing message from {} ({}), admin={}, text='{}'",
        user_name,
        user_id,
        is_admin,
        if command_text.len() > 50 {
            format!("{}...", &command_text[..50])
        } else {
            command_text.clone()
        }
    );

    if is_admin {
        // Admin: forward to agent
        Ok(ProcessResult::forward_to_agent(ForwardRequest {
            text: command_text,
            user_id,
            user_name,
            is_admin: true,
        }))
    } else {
        // Regular user: try limited commands
        match commands::parse(&command_text) {
            Some(cmd) => {
                let response = commands::execute(cmd, &user_id, db).await?;
                Ok(ProcessResult::handled(response))
            }
            None => {
                // Not a recognized limited command
                Ok(ProcessResult::handled(commands::permission_denied_message()))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_command_text() {
        let bot_id = UserId::new(123456789);

        // Normal mention
        assert_eq!(
            extract_command_text("<@123456789> help", bot_id),
            "help"
        );

        // Nickname mention
        assert_eq!(
            extract_command_text("<@!123456789> register 0x123", bot_id),
            "register 0x123"
        );

        // Multiple mentions
        assert_eq!(
            extract_command_text("<@123456789> <@123456789> test", bot_id),
            "test"
        );

        // No mention
        assert_eq!(
            extract_command_text("just some text", bot_id),
            "just some text"
        );
    }
}
