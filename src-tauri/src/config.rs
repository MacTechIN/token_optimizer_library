use std::fs;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    pub api_key: String,
    pub active_preset_id: String,
    pub model: Option<String>,
    pub api_url: Option<String>,
    pub target_language: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            active_preset_id: "default".to_string(),
            model: None,
            api_url: None,
            target_language: Some("en".to_string()),
        }
    }
}

fn get_config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut dir = app_handle.path().app_config_dir()
        .map_err(|e| format!("Failed to resolve app config dir: {}", e))?;
    // Ensure the config directory exists
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }
    dir.push("config.json");
    Ok(dir)
}

#[tauri::command]
pub fn load_settings_cmd(app_handle: tauri::AppHandle) -> Result<AppConfig, String> {
    let path = get_config_path(&app_handle)?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let data = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    let config: AppConfig = serde_json::from_str(&data)
        .unwrap_or_else(|_| AppConfig::default());
    Ok(config)
}

#[tauri::command]
pub fn save_settings_cmd(app_handle: tauri::AppHandle, settings: AppConfig) -> Result<(), String> {
    let path = get_config_path(&app_handle)?;
    let data = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, data)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    Ok(())
}
