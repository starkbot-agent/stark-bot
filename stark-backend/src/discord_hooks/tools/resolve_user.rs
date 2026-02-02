//! Tool to resolve Discord user mentions to registered public addresses

use crate::tools::registry::Tool;
use crate::tools::types::{
    PropertySchema, ToolContext, ToolDefinition, ToolGroup, ToolInputSchema, ToolResult,
};
use async_trait::async_trait;
use regex::Regex;
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;

/// Tool for resolving Discord user mentions to their registered public addresses
pub struct DiscordResolveUserTool {
    definition: ToolDefinition,
}

impl DiscordResolveUserTool {
    pub fn new() -> Self {
        let mut properties = HashMap::new();

        properties.insert(
            "user_mention".to_string(),
            PropertySchema {
                schema_type: "string".to_string(),
                description: "Discord user mention in format '<@USER_ID>' or '<@!USER_ID>', \
                    or just the numeric user ID"
                    .to_string(),
                default: None,
                items: None,
                enum_values: None,
            },
        );

        Self {
            definition: ToolDefinition {
                name: "discord_resolve_user".to_string(),
                description: "Resolve a Discord user mention to their registered public address. \
                    Use this when you need to tip or send tokens to a Discord user mentioned \
                    in a message. The user must have registered their address via '@starkbot register'. \
                    Returns the user's Discord ID, username, and public address if registered."
                    .to_string(),
                input_schema: ToolInputSchema {
                    schema_type: "object".to_string(),
                    properties,
                    required: vec!["user_mention".to_string()],
                },
                group: ToolGroup::Messaging,
            },
        }
    }
}

impl Default for DiscordResolveUserTool {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Deserialize)]
struct ResolveParams {
    user_mention: String,
}

#[async_trait]
impl Tool for DiscordResolveUserTool {
    fn definition(&self) -> ToolDefinition {
        self.definition.clone()
    }

    async fn execute(&self, params: Value, context: &ToolContext) -> ToolResult {
        let params: ResolveParams = match serde_json::from_value(params) {
            Ok(p) => p,
            Err(e) => return ToolResult::error(format!("Invalid parameters: {}", e)),
        };

        let mention = params.user_mention.trim();

        // Parse Discord mention format: <@123456789> or <@!123456789> or just the ID
        let user_id = extract_user_id(mention);

        let user_id = match user_id {
            Some(id) => id,
            None => {
                return ToolResult::error(format!(
                    "Invalid Discord mention format: '{}'. \
                    Expected '<@USER_ID>', '<@!USER_ID>', or a numeric user ID.",
                    mention
                ));
            }
        };

        // Get database from context
        let db = match &context.database {
            Some(db) => db,
            None => {
                return ToolResult::error(
                    "Database not available in tool context. Cannot resolve Discord user.",
                );
            }
        };

        // Query the database
        match crate::discord_hooks::db::get_profile(db, &user_id) {
            Ok(Some(profile)) => {
                if let Some(address) = profile.public_address {
                    ToolResult::success(
                        json!({
                            "discord_user_id": profile.discord_user_id,
                            "username": profile.discord_username,
                            "public_address": address,
                            "registered": true,
                            "registered_at": profile.registered_at
                        })
                        .to_string(),
                    )
                } else {
                    ToolResult::success(
                        json!({
                            "discord_user_id": profile.discord_user_id,
                            "username": profile.discord_username,
                            "public_address": null,
                            "registered": false,
                            "error": "User has not registered a public address. \
                                They need to run '@starkbot register <address>' first."
                        })
                        .to_string(),
                    )
                }
            }
            Ok(None) => ToolResult::success(
                json!({
                    "discord_user_id": user_id,
                    "username": null,
                    "public_address": null,
                    "registered": false,
                    "error": "User has never interacted with StarkBot. \
                        They need to run '@starkbot register <address>' first."
                })
                .to_string(),
            ),
            Err(e) => ToolResult::error(format!("Database error: {}", e)),
        }
    }
}

/// Extract user ID from various mention formats
fn extract_user_id(mention: &str) -> Option<String> {
    // Try to match <@123456789> or <@!123456789>
    let re = Regex::new(r"<@!?(\d+)>").unwrap();
    if let Some(caps) = re.captures(mention) {
        return caps.get(1).map(|m| m.as_str().to_string());
    }

    // Try to match just a numeric ID
    if mention.chars().all(|c| c.is_ascii_digit()) && !mention.is_empty() {
        return Some(mention.to_string());
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_user_id_mention() {
        assert_eq!(
            extract_user_id("<@123456789012345678>"),
            Some("123456789012345678".to_string())
        );
    }

    #[test]
    fn test_extract_user_id_nick_mention() {
        assert_eq!(
            extract_user_id("<@!123456789012345678>"),
            Some("123456789012345678".to_string())
        );
    }

    #[test]
    fn test_extract_user_id_raw() {
        assert_eq!(
            extract_user_id("123456789012345678"),
            Some("123456789012345678".to_string())
        );
    }

    #[test]
    fn test_extract_user_id_invalid() {
        assert_eq!(extract_user_id("invalid"), None);
        assert_eq!(extract_user_id("@username"), None);
        assert_eq!(extract_user_id(""), None);
    }

    #[test]
    fn test_definition() {
        let tool = DiscordResolveUserTool::new();
        let def = tool.definition();

        assert_eq!(def.name, "discord_resolve_user");
        assert_eq!(def.group, ToolGroup::Messaging);
        assert!(def.input_schema.required.contains(&"user_mention".to_string()));
    }
}
