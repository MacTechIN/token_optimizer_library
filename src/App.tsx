import { useEffect, useState } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { FileDropZone } from "./components/FileDropZone";
import { SearchInput } from "./components/SearchInput";
import { StatusBar } from "./components/StatusBar";
import { DEFAULT_PRESETS, loadSettings, saveSettings } from "./services/presetManager";
import { processInput, loadSettingsFromBackend, saveSettingsToBackend } from "./services/tauriIpc";

/**
 * Main application coordinator managing inputs, preset toggling, 
 * local storage, API integration, and dynamic window resizing.
 */
function App() {
  const [inputText, setInputText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [activePresetId, setActivePresetId] = useState("default");
  const [targetLanguage, setTargetLanguage] = useState<"en" | "ko">("en");
  
  const [isLoading, setIsLoading] = useState(false);
  const [savings, setSavings] = useState<{ original: number; optimized: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 1. Initial configuration load on mount
  useEffect(() => {
    const initSettings = async () => {
      try {
        const backendConfig = await loadSettingsFromBackend();
        if (backendConfig && backendConfig.api_key) {
          setApiKey(backendConfig.api_key);
          setActivePresetId(backendConfig.active_preset_id || "default");
          setTargetLanguage((backendConfig.target_language as "en" | "ko") || "en");
          return;
        }
      } catch (e) {
        console.error("Failed to load settings from backend:", e);
      }

      const settings = loadSettings();
      setApiKey(settings.apiKey);
      setActivePresetId(settings.activePresetId);
      const localLang = localStorage.getItem("to_target_language") as "en" | "ko" || "en";
      setTargetLanguage(localLang);

      if (settings.apiKey) {
        try {
          await saveSettingsToBackend({
            api_key: settings.apiKey,
            active_preset_id: settings.activePresetId,
            model: null,
            api_url: null,
            target_language: localLang,
          });
        } catch (e) {
          console.error("Failed to sync settings to backend:", e);
        }
      } else {
        setShowSettings(true);
      }
    };

    initSettings();
  }, []);

  // 2. Perform dynamic window resizing based on settings/error state
  useEffect(() => {
    const height = showSettings || error ? 130 : 90;
    getCurrentWindow().setSize(new LogicalSize(640, height));
  }, [showSettings, error]);

  const presetBase = DEFAULT_PRESETS.find((p) => p.id === activePresetId) || DEFAULT_PRESETS[0];

  // Dynamically tailor prompt language!
  const systemPrompt = targetLanguage === "ko"
    ? presetBase.systemPrompt
        .replace(
          "Translate the user's input (including Korean) into English first, then compress it into a highly concise, token-efficient English prompt. Remove all filler words, greetings, and redundant metadata. Output ONLY the optimized English prompt. Never output Korean.",
          "Compress the user's input into a highly concise, token-efficient Korean prompt. Remove all filler words, greetings, and redundant metadata. Output ONLY the optimized Korean prompt. Never output English."
        )
        .replace(
          "Output a highly concise, token-efficient English code review report. Do not include greetings or boilerplate. Never output Korean.",
          "Output a highly concise, token-efficient Korean code review report. Do not include greetings or boilerplate. Never output English."
        )
        .replace(
          "Compress the provided text into a highly dense, bullet-point summary in English, preserving core data and entities. Output ONLY the bullet points in English. Never output Korean.",
          "Compress the provided text into a highly dense, bullet-point summary in Korean, preserving core data and entities. Output ONLY the bullet points in Korean. Never output English."
        )
    : presetBase.systemPrompt;

  // 3. Preset switching by Tab key press
  const handleTabPress = () => {
    const currentIndex = DEFAULT_PRESETS.findIndex((p) => p.id === activePresetId);
    const nextIndex = (currentIndex + 1) % DEFAULT_PRESETS.length;
    const nextPreset = DEFAULT_PRESETS[nextIndex];
    setActivePresetId(nextPreset.id);
    saveSettings({ apiKey, activePresetId: nextPreset.id });
    saveSettingsToBackend({
      api_key: apiKey,
      active_preset_id: nextPreset.id,
      model: null,
      api_url: null,
      target_language: targetLanguage,
    }).catch(console.error);
    setSavings(null);
  };

  // 4. API Key setup handler
  const handleSettingsSave = (newKey: string, newLang: "en" | "ko") => {
    setApiKey(newKey);
    setTargetLanguage(newLang);
    saveSettings({ apiKey: newKey, activePresetId });
    localStorage.setItem("to_target_language", newLang);
    saveSettingsToBackend({
      api_key: newKey,
      active_preset_id: activePresetId,
      model: null,
      api_url: null,
      target_language: newLang,
    }).catch(console.error);
    setShowSettings(false);
    setError(null);
  };

  // 5. Execute optimization pipeline
  const executePipeline = async (text: string, filePath: string | null) => {
    if (!apiKey) {
      setError("OpenAI API Key가 필요합니다. 우측 열쇠 버튼을 클릭하고 입력해주세요.");
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSavings(null);

    try {
      const res = await processInput(text, filePath, apiKey, systemPrompt);
      if (res.success) {
        setSavings({ original: res.original_length, optimized: res.optimized_length });
        setInputText("");
        
        // Gracefully hide window after 1.8s to let the user see the success report
        setTimeout(() => {
          getCurrentWindow().hide();
        }, 1800);
      } else {
        setError(res.error_message || "알 수 없는 에러가 발생했습니다.");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    executePipeline(inputText, null);
  };

  const handleFileDrop = (path: string) => {
    executePipeline("", path);
  };

  return (
    <FileDropZone onFileDrop={handleFileDrop}>
      <div className="w-full h-full flex flex-col justify-between bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-between min-h-[52px]">
          {showSettings ? (
            <div className="w-full flex flex-col gap-2 px-4 py-2">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  defaultValue={apiKey}
                  id="apiKeyInput"
                  placeholder="OpenAI API Key 입력 (sk-...)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSettingsSave(e.currentTarget.value, targetLanguage);
                    } else if (e.key === "Escape") {
                      if (apiKey) setShowSettings(false);
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-white/5 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-indigo-500/50"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById("apiKeyInput") as HTMLInputElement;
                    handleSettingsSave(input.value, targetLanguage);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  저장
                </button>
                {apiKey && (
                  <button
                    onClick={() => setShowSettings(false)}
                    className="bg-white/5 hover:bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-white/60">
                <div className="flex items-center gap-2">
                  <span>출력 언어:</span>
                  <button
                    onClick={() => setTargetLanguage("en")}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      targetLanguage === "en"
                        ? "bg-indigo-600/30 border-indigo-500 text-white font-semibold"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    영문 (추천)
                  </button>
                  <button
                    onClick={() => setTargetLanguage("ko")}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      targetLanguage === "ko"
                        ? "bg-amber-600/30 border-amber-500 text-white font-semibold"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    한글
                  </button>
                </div>
                <div className="text-amber-400/80 font-light">
                  {targetLanguage === "ko" 
                    ? "⚠️ 한글 출력 시 영문 대비 약 4.1배 토큰 요금 발생"
                    : "✓ 영문 출력 시 토큰 효율 410% 최적화 (1자≒0.25토큰)"}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="w-full flex items-center justify-between gap-4 px-4 py-2 text-rose-400 text-xs font-light">
              <span className="truncate flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-white/40 hover:text-white transition-colors uppercase font-bold text-[10px]"
              >
                닫기
              </button>
            </div>
          ) : (
            <SearchInput
              value={inputText}
              onChange={setInputText}
              onSubmit={handleSubmit}
              onTabPress={handleTabPress}
              isLoading={isLoading}
              placeholder="최적화할 텍스트 입력 혹은 문서(PDF/Word)/이미지 드롭 (Tab: 프리셋 전환)"
            />
          )}
        </div>

        {/* Status Bar */}
        <StatusBar
          activePresetName={presetBase.name}
          activePresetDesc={presetBase.description}
          isLoading={isLoading}
          savings={savings}
          onSettingsToggle={() => setShowSettings(!showSettings)}
          showApiKey={showSettings}
          targetLanguage={targetLanguage}
        />
      </div>
    </FileDropZone>
  );
}

export default App;
