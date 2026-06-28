import { invoke } from "@tauri-apps/api/core";

export interface ProcessResult {
  success: boolean;
  result: string;
  original_length: number;
  optimized_length: number;
  error_message: string | null;
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
