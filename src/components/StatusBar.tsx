interface StatusBarProps {
  activePresetName: string;
  activePresetDesc: string;
  isLoading: boolean;
  savings: {
    original: number;
    optimized: number;
  } | null;
  onSettingsToggle: () => void;
  showApiKey: boolean;
}

/**
 * Bottom status bar displaying preset info, loader, conversion results (savings ratio), and settings toggle.
 */
export function StatusBar({
  activePresetName,
  activePresetDesc,
  isLoading,
  savings,
  onSettingsToggle,
  showApiKey,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/10 text-[11px] text-white/50 bg-black/10 select-none">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white/70 bg-white/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
          {activePresetName}
        </span>
        <span className="hidden md:inline text-white/40 font-light truncate max-w-[280px]">
          {activePresetDesc}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isLoading && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            <span className="text-indigo-300 font-light">압축 최적화 수행 중...</span>
          </div>
        )}

        {!isLoading && savings && (
          <span className="text-emerald-400 font-medium">
            클립보드 자동 복사! {savings.original}자 → {savings.optimized}자 ({-Math.round((1 - savings.original / savings.optimized) * 100)}% 절약)
          </span>
        )}

        <button
          onClick={onSettingsToggle}
          className={`hover:text-white transition-colors p-1 ${
            showApiKey ? "text-indigo-400" : "text-white/40"
          }`}
          title="OpenAI API Key 설정"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
