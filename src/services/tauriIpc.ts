import { invoke } from "@tauri-apps/api/core";

export interface ProcessResult {
  success: boolean;
  result: string;
  original_length: number;
  optimized_length: number;
  error_message: string | null;
}

export interface AppConfig {
  api_key: string;
  active_preset_id: string;
  model: string | null;
  api_url: string | null;
  target_language: string | null;
}

/**
 * Sends text or file path to Tauri backend to run the token optimizer pipeline.
 */
export async function processInput(
  text: string,
  filePath: string | null,
  apiKey: string,
  systemPrompt: string,
  model?: string | null,
  apiUrl?: string | null
): Promise<ProcessResult> {
  return await invoke<ProcessResult>("process_input_cmd", {
    text,
    filePath,
    apiKey,
    systemPrompt,
    model: model || null,
    apiUrl: apiUrl || null,
  });
}

/**
 * Loads settings from the local backend config file.
 */
export async function loadSettingsFromBackend(): Promise<AppConfig> {
  return await invoke<AppConfig>("load_settings_cmd");
}

/**
 * Saves settings to the local backend config file.
 */
export async function saveSettingsToBackend(settings: AppConfig): Promise<void> {
  return await invoke<void>("save_settings_cmd", { settings });
}
