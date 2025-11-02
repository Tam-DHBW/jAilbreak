use aws_sdk_bedrockagentruntime::types::{
    CreationMode, InferenceConfiguration, InlineAgentPayloadPart, InlineAgentResponseStream,
    PromptConfiguration, PromptOverrideConfiguration, PromptState, PromptType,
};
use aws_sdk_dynamodb::types::AttributeValue;
use axum::{
    BoxError,
    extract::{FromRequest, Json, Path},
};
use indoc::indoc;
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use serde_dynamo::from_item;
use serde_json::json;

use super::*;
use crate::{ExtractState, response::ApiResult};

const MIN_INSTRUCTION_LENGTH: usize = 40;

#[derive(Deserialize, Debug)]
pub struct UserInfo {
    username: String,
}

#[derive(Deserialize, FromRequest, Debug)]
#[from_request(via(Json))]
pub struct ChatRequest {
    message: String,
    user_info: UserInfo,
}

#[derive(Serialize, Debug)]
pub struct ChatReply {
    reply: String,
}

error_response!(ChatError {
    /// Level does not exist
    LevelDoesNotExist[NOT_FOUND],
    /// Fetching level failed
    GetLevel(BoxError),
    /// Failed to fetch prompt components
    QueryPromptComponents(BoxError),
    /// Failed to invoke bedrock
    BedrockInvocationFailed(BoxError),
    /// Model responded with Non-UTF8 characters
    IllegalModelResponse,
});

#[axum::debug_handler(state=crate::State)]
pub async fn chat_session(
    state: ExtractState,
    Path((level_id, session_id)): Path<(LevelID, String)>,
    ChatRequest { message, user_info }: ChatRequest,
) -> ApiResult<Json<ChatReply>> {
    let level = state
        .dynamo
        .get_item()
        .table_name(db::Level::TABLE)
        .key(
            db::Level::PARTITION,
            AttributeValue::N(level_id.0.to_string()),
        )
        .send()
        .await
        .box_error()
        .map_err(ChatError::GetLevel)?
        .item
        .ok_or(ChatError::LevelDoesNotExist)?;

    let level: db::Level = from_item(level).box_error().map_err(ChatError::GetLevel)?;

    let components = prompt_components_for_level(&state.dynamo, &level).await?;

    let mut instruction = components
        .into_iter()
        .map(|component| component.text)
        .join(" ")
        .replace("{{LEVEL_NAME}}", &level.name)
        .replace("{{LEVEL_PASSWORD}}", "uy8b7t4rsduiy64avfd")
        .replace("{{USER_SUB}}", &user_info.username);
    
    if instruction.len() < MIN_INSTRUCTION_LENGTH {
        instruction.push_str(&" ".repeat(MIN_INSTRUCTION_LENGTH - instruction.len()));
    }

    let base_prompt = json!({
        "system": indoc!("
            ALWAYS provide your final response to the User request within <answer> </answer> tags! Do not use it to ask questions!
            Additionally, follow these instructions:
            $instruction$
        "),
        "messages": [
            {
                "role" : "user",
                "content": [{
                    "text": "$question$"
                }]
            },
            //{
            //    "role" : "assistant",
            //    "content" : [{
            //        "text": "Response: <answer>"
            //    }]
            //}
        ]
    });

    let session_id = format!("level{level_id}-{session_id}", level_id = level_id.0);

    let mut response = state
        .bedrockagent
        .invoke_inline_agent()
        .session_id(session_id)
        .idle_session_ttl_in_seconds(120)
        .foundation_model("eu.meta.llama3-2-1b-instruct-v1:0")
        .prompt_override_configuration(
            PromptOverrideConfiguration::builder()
                .prompt_configurations(
                    PromptConfiguration::builder()
                        .prompt_type(PromptType::PreProcessing)
                        .prompt_state(PromptState::Disabled)
                        .build(),
                )
                .prompt_configurations(
                    PromptConfiguration::builder()
                        .prompt_type(PromptType::KnowledgeBaseResponseGeneration)
                        .prompt_state(PromptState::Disabled)
                        .build(),
                )
                .prompt_configurations(
                    PromptConfiguration::builder()
                        .prompt_type(PromptType::PostProcessing)
                        .prompt_state(PromptState::Disabled)
                        .build(),
                )
                .prompt_configurations(
                    PromptConfiguration::builder()
                        .prompt_type(PromptType::Orchestration)
                        .prompt_state(PromptState::Enabled)
                        .parser_mode(CreationMode::Default)
                        .inference_configuration(
                            InferenceConfiguration::builder()
                                .maximum_length(150)
                                .temperature(0.9)
                                .stop_sequences("</answer>")
                                .build(),
                        )
                        .prompt_creation_mode(CreationMode::Overridden)
                        .base_prompt_template(base_prompt.to_string())
                        .build(),
                )
                .build()
                .unwrap(),
        )
        .instruction(instruction)
        .input_text(message)
        .send()
        .await
        .map_err(|e| ChatError::BedrockInvocationFailed(Box::new(e)))?;

    let mut reply_stream: Vec<u8> = Vec::new();
    while let Some(chunk) = response
        .completion
        .recv()
        .await
        .map_err(|e| ChatError::BedrockInvocationFailed(Box::new(e)))?
    {
        if let InlineAgentResponseStream::Chunk(InlineAgentPayloadPart {
            bytes: Some(chunk), ..
        }) = chunk
        {
            reply_stream.extend(chunk.as_ref());
        }
    }

    let reply = String::from_utf8(reply_stream).map_err(|_| ChatError::IllegalModelResponse)?;

    Ok(Json(ChatReply { reply }))
}

async fn prompt_components_for_level(
    dynamo: &aws_sdk_dynamodb::Client,
    level: &db::Level,
) -> ApiResult<Vec<db::PromptComponent>> {
    if level.prompt_components.is_empty() {
        return Ok(Vec::new());
    }

    let component_ids = level
        .prompt_components
        .iter()
        .map(|component| component.0.to_string());

    let mut components_query = dynamo
        .query()
        .table_name(db::PromptComponent::TABLE)
        .index_name(db::PromptComponent::SECONDARY_TEMPLATE_INDEX)
        .key_condition_expression("#pk = :pk")
        .expression_attribute_names("#pk", db::PromptComponent::SECONDARY_TEMPLATE_ID)
        .expression_attribute_values(":pk", AttributeValue::S(db::TemplateID::default().0));

    let mut placeholders = Vec::new();
    for id in component_ids {
        let placeholder = format!(":{id}");
        components_query = components_query
            .expression_attribute_values(&placeholder, AttributeValue::N(id.to_string()));
        placeholders.push(placeholder);
    }

    components_query = components_query
        .filter_expression(format!(
            "#component IN ({placeholders})",
            placeholders = placeholders.join(",")
        ))
        .expression_attribute_names("#component", db::PromptComponent::PARTITION);

    let components: Vec<db::PromptComponent> = components_query
        .send()
        .await
        .box_error()
        .and_then(|output| from_items(output.items.unwrap_or_default()).box_error())
        .map_err(ChatError::QueryPromptComponents)?;

    Ok(components)
}
