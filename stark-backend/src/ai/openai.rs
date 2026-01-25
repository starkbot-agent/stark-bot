use crate::ai::types::{AiResponse, ToolCall};
use crate::ai::Message;
use crate::tools::ToolDefinition;
use reqwest::{header, Client};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct OpenAIClient {
    client: Client,
    endpoint: String,
    model: String,
}

#[derive(Debug, Serialize)]
struct OpenAICompletionRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    max_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    tools: Option<Vec<OpenAITool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tool_choice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenAIMessage {
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<OpenAIToolCall>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
}

#[derive(Debug, Serialize)]
struct OpenAITool {
    #[serde(rename = "type")]
    tool_type: String,
    function: OpenAIFunction,
}

#[derive(Debug, Serialize)]
struct OpenAIFunction {
    name: String,
    description: String,
    parameters: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenAIToolCall {
    pub id: String,
    #[serde(rename = "type")]
    pub call_type: String,
    pub function: OpenAIFunctionCall,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenAIFunctionCall {
    pub name: String,
    pub arguments: String,
}

#[derive(Debug, Deserialize)]
struct OpenAICompletionResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: OpenAIResponseMessage,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponseMessage {
    content: Option<String>,
    tool_calls: Option<Vec<OpenAIToolCall>>,
}

#[derive(Debug, Deserialize)]
struct OpenAIErrorResponse {
    error: OpenAIError,
}

#[derive(Debug, Deserialize)]
struct OpenAIError {
    message: String,
}

impl OpenAIClient {
    pub fn new(api_key: &str, endpoint: Option<&str>, model: Option<&str>) -> Result<Self, String> {
        let mut headers = header::HeaderMap::new();
        headers.insert(
            header::CONTENT_TYPE,
            header::HeaderValue::from_static("application/json"),
        );

        let auth_value = header::HeaderValue::from_str(&format!("Bearer {}", api_key))
            .map_err(|e| format!("Invalid API key format: {}", e))?;
        headers.insert(header::AUTHORIZATION, auth_value);

        let client = Client::builder()
            .default_headers(headers)
            .timeout(Duration::from_secs(120))
            .build()
            .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

        Ok(Self {
            client,
            endpoint: endpoint
                .unwrap_or("https://api.openai.com/v1/chat/completions")
                .to_string(),
            model: model.unwrap_or("gpt-4o").to_string(),
        })
    }

    pub async fn generate_text(&self, messages: Vec<Message>) -> Result<String, String> {
        let response = self.generate_with_tools_internal(messages, vec![], vec![]).await?;
        Ok(response.content)
    }

    pub async fn generate_with_tools(
        &self,
        messages: Vec<Message>,
        tool_history: Vec<OpenAIMessage>,
        tools: Vec<ToolDefinition>,
    ) -> Result<AiResponse, String> {
        self.generate_with_tools_internal(messages, tool_history, tools).await
    }

    async fn generate_with_tools_internal(
        &self,
        messages: Vec<Message>,
        tool_history: Vec<OpenAIMessage>,
        tools: Vec<ToolDefinition>,
    ) -> Result<AiResponse, String> {
        // Convert messages to OpenAI format
        let mut api_messages: Vec<OpenAIMessage> = messages
            .into_iter()
            .map(|m| OpenAIMessage {
                role: m.role.to_string(),
                content: Some(m.content),
                tool_calls: None,
                tool_call_id: None,
            })
            .collect();

        // Add tool history messages (previous tool calls and results)
        api_messages.extend(tool_history);

        // Convert tool definitions to OpenAI format
        let openai_tools: Option<Vec<OpenAITool>> = if tools.is_empty() {
            None
        } else {
            Some(
                tools
                    .iter()
                    .map(|t| OpenAITool {
                        tool_type: "function".to_string(),
                        function: OpenAIFunction {
                            name: t.name.clone(),
                            description: t.description.clone(),
                            parameters: json!({
                                "type": t.input_schema.schema_type,
                                "properties": t.input_schema.properties.iter().map(|(k, v)| {
                                    (k.clone(), json!({
                                        "type": v.schema_type,
                                        "description": v.description
                                    }))
                                }).collect::<serde_json::Map<String, Value>>(),
                                "required": t.input_schema.required
                            }),
                        },
                    })
                    .collect(),
            )
        };

        let request = OpenAICompletionRequest {
            model: self.model.clone(),
            messages: api_messages,
            max_tokens: 4096,
            tools: openai_tools,
            tool_choice: if tools.is_empty() { None } else { Some("auto".to_string()) },
        };

        log::debug!("Sending request to OpenAI-compatible API: {}", self.endpoint);

        let response = self
            .client
            .post(&self.endpoint)
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("OpenAI API request failed: {}", e))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();

            if let Ok(error_response) = serde_json::from_str::<OpenAIErrorResponse>(&error_text) {
                return Err(format!("OpenAI API error: {}", error_response.error.message));
            }

            return Err(format!(
                "OpenAI API returned error status: {}, body: {}",
                status, error_text
            ));
        }

        let response_data: OpenAICompletionResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

        let choice = response_data
            .choices
            .first()
            .ok_or_else(|| "OpenAI API returned no choices".to_string())?;

        let content = choice.message.content.clone().unwrap_or_default();
        let finish_reason = choice.finish_reason.clone();

        // Convert tool calls if present
        let tool_calls: Vec<ToolCall> = choice
            .message
            .tool_calls
            .as_ref()
            .map(|calls| {
                calls
                    .iter()
                    .filter_map(|tc| {
                        let args: Value = serde_json::from_str(&tc.function.arguments)
                            .unwrap_or(json!({}));
                        Some(ToolCall {
                            id: tc.id.clone(),
                            name: tc.function.name.clone(),
                            arguments: args,
                        })
                    })
                    .collect()
            })
            .unwrap_or_default();

        let is_tool_use = finish_reason.as_deref() == Some("tool_calls") || !tool_calls.is_empty();

        Ok(AiResponse {
            content,
            tool_calls,
            stop_reason: if is_tool_use {
                Some("tool_use".to_string())
            } else {
                Some("end_turn".to_string())
            },
        })
    }

    /// Build tool result messages for continuing after tool execution
    pub fn build_tool_result_messages(
        tool_calls: &[ToolCall],
        tool_responses: &[crate::ai::ToolResponse],
    ) -> Vec<OpenAIMessage> {
        let mut messages = Vec::new();

        // First, add the assistant message with tool calls
        let openai_tool_calls: Vec<OpenAIToolCall> = tool_calls
            .iter()
            .map(|tc| OpenAIToolCall {
                id: tc.id.clone(),
                call_type: "function".to_string(),
                function: OpenAIFunctionCall {
                    name: tc.name.clone(),
                    arguments: serde_json::to_string(&tc.arguments).unwrap_or_default(),
                },
            })
            .collect();

        messages.push(OpenAIMessage {
            role: "assistant".to_string(),
            content: None,
            tool_calls: Some(openai_tool_calls),
            tool_call_id: None,
        });

        // Then add the tool results
        for response in tool_responses {
            messages.push(OpenAIMessage {
                role: "tool".to_string(),
                content: Some(response.content.clone()),
                tool_calls: None,
                tool_call_id: Some(response.tool_call_id.clone()),
            });
        }

        messages
    }
}
