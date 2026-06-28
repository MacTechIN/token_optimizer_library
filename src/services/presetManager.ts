export interface Preset {
  id: string;
  name: string;
  systemPrompt: string;
  description: string;
}

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: "default",
    name: "Token Savings (Default)",
    systemPrompt: "You are an AI prompt optimizer. Convert the provided text or document content into a highly concise, token-efficient English prompt. Remove all filler words, greetings, and redundant metadata. Output ONLY the optimized prompt.",
    description: "Compresses raw text/docs into a minimal token English prompt.",
  },
  {
    id: "code-review",
    name: "Code Review",
    systemPrompt: "You are an AI code reviewer. Analyze the code for bugs, design flaws, and optimizations. Output a highly concise, token-efficient English code review report. Do not include greetings or boilerplate.",
    description: "Performs dense code review and outputs clean English feedback.",
  },
  {
    id: "summary",
    name: "Executive Summary",
    systemPrompt: "You are an AI summarizer. Compress the provided text into a highly dense, bullet-point summary in English, preserving core data and entities. Output ONLY the bullet points.",
    description: "Summarizes documents into token-saving English bullets.",
  },
];

export interface AppSettings {
  apiKey: string;
  activePresetId: string;
}

/**
 * Loads application settings from localStorage.
 */
export function loadSettings(): AppSettings {
  const apiKey = localStorage.getItem("to_api_key") || "";
  const activePresetId = localStorage.getItem("to_active_preset_id") || "default";
  return { apiKey, activePresetId };
}

/**
 * Saves application settings to localStorage.
 */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem("to_api_key", settings.apiKey);
  localStorage.setItem("to_active_preset_id", settings.activePresetId);
}
