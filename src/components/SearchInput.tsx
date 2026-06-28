import { KeyboardEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onTabPress: () => void;
  isLoading: boolean;
  placeholder: string;
}

/**
 * Custom text input that binds system key events:
 * - Enter: Submit search/compression
 * - Esc: Hide window immediately
 * - Tab: Cycle presets
 */
export function SearchInput({
  value,
  onChange,
  onSubmit,
  onTabPress,
  isLoading,
  placeholder,
}: SearchInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      getCurrentWindow().hide();
    } else if (e.key === "Tab") {
      e.preventDefault(); // Prevents browser focus cycling
      onTabPress();
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      placeholder={isLoading ? "최적화 변환 작업 수행 중..." : placeholder}
      autoFocus
      className="w-full bg-transparent text-white text-base placeholder-white/30 border-none outline-none py-3 px-4 font-light rounded-xl disabled:opacity-50"
    />
  );
}
