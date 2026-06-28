import { useEffect, useState } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { FileDropZone } from "./components/FileDropZone";
import { SearchInput } from "./components/SearchInput";
import { StatusBar } from "./components/StatusBar";
import { DEFAULT_PRESETS, loadSettings, saveSettings } from "./services/presetManager";
import { processInput } from "./services/tauriIpc";

/**
 * Main application coordinator managing inputs, preset toggling, 
 * local storage, API integration, and dynamic window resizing.
 */
function App() {
  const [inputText, setInputText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [activePresetId, setActivePresetId] = useState("default");
  
  const [isLoading, setIsLoading] = useState(false);
  const [savings, setSavings] = useState<{ original: number; optimized: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 1. Initial configuration load on mount
  useEffect(() => {
    const settings = loadSettings();
    setApiKey(settings.apiKey);
    setActivePresetId(settings.activePresetId);

    // Prompt for API key immediately if missing
    if (!settings.apiKey) {
      setShowSettings(true);
    }
  }, []);

  // 2. Perform dynamic window resizing based on settings/error state
  useEffect(() => {
    const height = showSettings || error ? 130 : 90;
    getCurrentWindow().setSize(new LogicalSize(640, height));
  }, [showSettings, error]);

  const activePreset = DEFAULT_PRESETS.find((p) => p.id === activePresetId) || DEFAULT_PRESETS[0];

  // 3. Preset switching by Tab key press
  const handleTabPress = () => {
    const currentIndex = DEFAULT_PRESETS.findIndex((p) => p.id === activePresetId);
    const nextIndex = (currentIndex + 1) % DEFAULT_PRESETS.length;
    const nextPreset = DEFAULT_PRESETS[nextIndex];
    setActivePresetId(nextPreset.id);
    saveSettings({ apiKey, activePresetId: nextPreset.id });
    setSavings(null);
  };

  // 4. API Key setup handler
  const handleSettingsSave = (newKey: string) => {
    setApiKey(newKey);
    saveSettings({ apiKey: newKey, activePresetId });
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
      const res = await processInput(text, filePath, apiKey, activePreset.systemPrompt);
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
            <div className="w-full flex items-center gap-2 px-4 py-2">
              <input
                type="password"
                defaultValue={apiKey}
                placeholder="OpenAI API Key 입력 (sk-...) 후 Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSettingsSave(e.currentTarget.value);
                  } else if (e.key === "Escape") {
                    if (apiKey) setShowSettings(false);
                  }
                }}
                autoFocus
                className="flex-1 bg-white/5 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleSettingsSave(input.value);
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
          activePresetName={activePreset.name}
          activePresetDesc={activePreset.description}
          isLoading={isLoading}
          savings={savings}
          onSettingsToggle={() => setShowSettings(!showSettings)}
          showApiKey={showSettings}
        />
      </div>
    </FileDropZone>
  );
}

export default App;
