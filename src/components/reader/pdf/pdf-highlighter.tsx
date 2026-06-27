"use client";

import type { Highlight } from "@/types/reading";

interface PdfHighlighterProps {
  highlights: Highlight[];
  scale: number;
  onHighlightClick: (highlight: Highlight) => void;
}

export function PdfHighlighter({ highlights, scale, onHighlightClick }: PdfHighlighterProps) {
  return (
    <div className="highlight-overlay" style={{ inset: 0 }}>
      {highlights.map((hl) => {
        const rects = hl.position.rects || [];
        return rects.map((rect, i) => (
          <div
            key={`${hl.id}-${i}`}
            className="highlight-rect"
            style={{
              left: `${rect.x * scale}px`,
              top: `${rect.y * scale}px`,
              width: `${rect.width * scale}px`,
              height: `${rect.height * scale}px`,
              backgroundColor: hl.highlight_type === "strikethrough"
                ? "transparent"
                : hl.color + "60",
              borderBottom: hl.highlight_type === "underline"
                ? `2px solid ${hl.color}`
                : "none",
              textDecoration: hl.highlight_type === "strikethrough"
                ? `line-through ${hl.color}`
                : "none",
            }}
            onClick={() => onHighlightClick(hl)}
          />
        ));
      })}
    </div>
  );
}
