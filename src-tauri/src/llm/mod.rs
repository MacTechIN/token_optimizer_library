pub mod prompt;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
}

#[derive(Deserialize)]
struct ChatCompletionResponseChoice {
    message: ChatMessage,
}

#[derive(Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatCompletionResponseChoice>,
}

/// Calls OpenAI Chat Completion API to optimize the prompt text.
pub async fn request_llm_optimization(
    cleaned_text: &str,
    api_key: &str,
    system_prompt: &str,
    model: Option<String>,
    api_url: Option<String>,
) -> Result<String, String> {
    if api_key.trim().is_empty() {
        return Err("API key is empty. Please set your API key in settings.".to_string());
    }

    let model_name = model.unwrap_or_else(|| "gpt-4o-mini".to_string());
    let endpoint = api_url.unwrap_or_else(|| "https://api.openai.com/v1/chat/completions".to_string());

    let client = reqwest::Client::new();
    let request_body = ChatCompletionRequest {
        model: model_name,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: cleaned_text.to_string(),
            },
        ],
        temperature: 0.1,
    };

    let response = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("API returned error status ({}): {}", status, err_text));
    }

    let res_body: ChatCompletionResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    if res_body.choices.is_empty() {
        return Err("API returned no choices in response.".to_string());
    }

    Ok(res_body.choices[0].message.content.clone())
}
