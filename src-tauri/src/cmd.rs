use crate::clipboard;
use crate::llm;
use crate::ocr;
use crate::parser;
use serde::Serialize;
use std::path::Path;

#[derive(Serialize)]
pub struct ProcessResult {
    pub success: bool,
    pub result: String,
    pub original_length: usize,
    pub optimized_length: usize,
    pub error_message: Option<String>,
}

/// Main IPC Command called by the frontend.
/// Performs file parsing, OCR, cleaning, LLM optimization, and clipboard copying.
#[tauri::command]
pub async fn process_input_cmd(
    text: String,
    file_path: Option<String>,
    api_key: String,
    system_prompt: String,
    model: Option<String>,
    api_url: Option<String>,
) -> Result<ProcessResult, String> {
    // 1. Extract text from file or use direct input
    let raw_text = if let Some(ref path) = file_path {
        let path_ref = Path::new(path);
        let extension = path_ref
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.to_lowercase())
            .unwrap_or_default();

        match extension.as_str() {
            "png" | "jpg" | "jpeg" | "bmp" => {
                ocr::ocr_image(path).await.map_err(|e| format!("OCR Error: {}", e))?
            }
            _ => {
                parser::parse_file(path).map_err(|e| format!("Parser Error: {}", e))?
            }
        }
    } else {
        text
    };

    let original_length = raw_text.len();

    // 2. Preprocess text using prompt heuristics
    let cleaned_text = llm::prompt::clean_text(&raw_text);

    // 3. Request LLM optimization
    let optimized_prompt = llm::request_llm_optimization(&cleaned_text, &api_key, &system_prompt, model, api_url)
        .await
        .map_err(|e| format!("AI Optimization Error: {}", e))?;

    let optimized_length = optimized_prompt.len();

    // 4. Auto-copy result to OS clipboard
    clipboard::write_to_clipboard(&optimized_prompt)
        .map_err(|e| format!("Clipboard Copy Error: {}", e))?;

    Ok(ProcessResult {
        success: true,
        result: optimized_prompt,
        original_length,
        optimized_length,
        error_message: None,
    })
}

/// Sets the window pinned state (disables auto-hide on blur)
#[tauri::command]
pub fn toggle_pin_cmd(pinned: bool) {
    crate::IS_PINNED.store(pinned, std::sync::atomic::Ordering::Relaxed);
}
