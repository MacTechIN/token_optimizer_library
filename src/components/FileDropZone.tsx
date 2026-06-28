import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface FileDropZoneProps {
  children: React.ReactNode;
  onFileDrop: (path: string) => void;
}

/**
 * Handles OS-level file drag and drop events, extracting the absolute file path.
 */
export function FileDropZone({ children, onFileDrop }: FileDropZoneProps) {
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === "enter" || event.payload.type === "over") {
        setIsOver(true);
      } else if (event.payload.type === "drop") {
        setIsOver(false);
        const paths = event.payload.paths;
        if (paths && paths.length > 0) {
          onFileDrop(paths[0]);
        }
      } else {
        setIsOver(false);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [onFileDrop]);

  return (
    <div
      className={`relative w-full h-full rounded-2xl transition-all duration-300 ${
        isOver
          ? "border-2 border-dashed border-indigo-500 bg-indigo-50/10 scale-[0.99]"
          : "border border-transparent"
      }`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl pointer-events-none backdrop-blur-sm z-50">
          <div className="text-white text-sm font-medium tracking-wide animate-pulse">
            PDF, Word, 혹은 이미지 파일 드롭
          </div>
        </div>
      )}
    </div>
  );
}
