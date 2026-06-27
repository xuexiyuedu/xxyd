"use client";

import { Highlighter, Underline, Copy, Languages, BookmarkPlus, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HighlightColor } from "@/types/reading";

const COLORS: { color: HighlightColor; label: string }[] = [
  { color: "#FFEB3B", label: "黄" },
  { color: "#A5D6A7", label: "绿" },
  { color: "#90CAF9", label: "蓝" },
  { color: "#F48FB1", label: "粉" },
  { color: "#CE93D8", label: "紫" },
];

interface TextSelectionToolbarProps {
  rect: DOMRect;
  onHighlight: (color: HighlightColor) => void;
  onUnderline: (color: HighlightColor) => void;
  onCopy: () => void;
  onTranslate?: () => void;
  onDictionary?: () => void;
  onAddBookmark?: () => void;
}

export function TextSelectionToolbar({
  rect,
  onHighlight,
  onUnderline,
  onCopy,
  onTranslate,
  onDictionary,
  onAddBookmark,
}: TextSelectionToolbarProps) {
  // 定位工具条在选区上方
  const style: React.CSSProperties = {
    position: "fixed",
    left: rect.left + rect.width / 2,
    top: rect.top - 8,
    transform: "translate(-50%, -100%)",
    zIndex: 1000,
  };

  return (
    <div
      style={style}
      className="flex items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in zoom-in-95"
    >
      {/* 高亮颜色选择 */}
      <div className="flex items-center gap-0.5 px-1">
        {COLORS.map(({ color, label }) => (
          <button
            key={color}
            title={label}
            onClick={() => onHighlight(color)}
            className="h-5 w-5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* 操作按钮 */}
      <button
        title="下划线"
        onClick={() => onUnderline("#90CAF9")}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
      >
        <Underline className="h-4 w-4" />
      </button>

      <button
        title="复制"
        onClick={onCopy}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
      >
        <Copy className="h-4 w-4" />
      </button>

      {onTranslate && (
        <button
          title="翻译"
          onClick={onTranslate}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
        >
          <Languages className="h-4 w-4" />
        </button>
      )}

      {onDictionary && (
        <button
          title="查词"
          onClick={onDictionary}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
        >
          <BookOpen className="h-4 w-4" />
        </button>
      )}

      {onAddBookmark && (
        <button
          title="添加书签"
          onClick={onAddBookmark}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
        >
          <BookmarkPlus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
