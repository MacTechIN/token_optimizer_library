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
  targetLanguage: "en" | "ko";
  isPinned: boolean;
  onPinToggle: () => void;
}

/**
 * Bottom status bar displaying preset info, loader, conversion results,
 * target language token overhead warning, and window-pin/settings control triggers.
 */
export function StatusBar({
  activePresetName,
  activePresetDesc,
  isLoading,
  savings,
  onSettingsToggle,
  showApiKey,
  targetLanguage,
  isPinned,
  onPinToggle,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 text-[11px] text-white/50 bg-black/10 select-none">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white/70 bg-white/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
          {activePresetName}
        </span>
        <span className="hidden md:inline text-white/40 font-light truncate max-w-[240px]">
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
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-emerald-400 font-semibold">
              클립보드 복사 완료! {savings.original}자 → {savings.optimized}자 (
              {Math.max(0, Math.round((1 - savings.optimized / savings.original) * 100))}% 압축)
            </span>
            <span className="text-[9px] text-white/45 font-light">
              {targetLanguage === "en" ? (
                <span>
                  영문 토큰 최적화: ~{Math.ceil(savings.optimized * 0.25)} 토큰 
                  (한글 유지 시 약 ~{Math.ceil(savings.optimized * 0.8 * 1.3)} 토큰 대비 <strong className="text-indigo-300 font-medium">76% 절약</strong>)
                </span>
              ) : (
                <span>
                  한글 토큰 최적화: ~{Math.ceil(savings.optimized * 1.3)} 토큰 
                  (영문 변환 시 약 ~{Math.ceil(savings.optimized * 1.25 * 0.25)} 토큰 대비 <strong className="text-amber-300 font-medium">4.1배 추가소모</strong>)
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Pin Toggle Button */}
          <button
            onClick={onPinToggle}
            className={`hover:text-white transition-colors p-1 rounded ${
              isPinned ? "text-indigo-400 bg-indigo-500/10" : "text-white/40 hover:bg-white/5"
            }`}
            title={isPinned ? "화면 고정 활성화됨 (클릭 시 자동 숨김 전환)" : "화면 고정 비활성화됨 (클릭 시 창 고정)"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isPinned ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
            >
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.24V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4.24a2 2 0 0 1-.78 1.28l-2.78 3.5a2 2 0 0 0-.44 1.24Z"></path>
            </svg>
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsToggle}
            className={`hover:text-white transition-colors p-1 rounded ${
              showApiKey ? "text-indigo-400 bg-indigo-500/10" : "text-white/40 hover:bg-white/5"
            }`}
            title="설정 및 출력 언어 변경"
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
    </div>
  );
}
