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
}

/**
 * Bottom status bar displaying preset info, loader, conversion results,
 * and a comparison formula for English vs Korean token overhead.
 */
export function StatusBar({
  activePresetName,
  activePresetDesc,
  isLoading,
  savings,
  onSettingsToggle,
  showApiKey,
  targetLanguage,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 text-[11px] text-white/50 bg-black/10 select-none">
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

        <button
          onClick={onSettingsToggle}
          className={`hover:text-white transition-colors p-1 ${
            showApiKey ? "text-indigo-400" : "text-white/40"
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
  );
}
