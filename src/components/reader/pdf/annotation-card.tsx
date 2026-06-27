"use client";

import { useState } from "react";
import { X, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Highlight } from "@/types/reading";
import { formatRelativeTime } from "@/lib/utils";

interface AnnotationCardProps {
  highlight: Highlight;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (note: string) => void;
}

export function AnnotationCard({ highlight, onClose, onDelete, onUpdate }: AnnotationCardProps) {
  const [note, setNote] = useState(highlight.note || "");
  const [isEditing, setIsEditing] = useState(!highlight.note);

  const style: React.CSSProperties = {
    position: "fixed",
    right: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1000,
  };

  return (
    <div
      style={style}
      className="w-72 rounded-lg border bg-popover p-4 shadow-xl animate-in slide-in-from-right"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded"
            style={{ backgroundColor: highlight.color + "60" }}
          />
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(highlight.created_at)}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 摘录原文 */}
      <div className="mb-3 rounded-md bg-muted p-2">
        <p className="text-xs text-muted-foreground mb-1">摘录</p>
        <p className="text-sm line-clamp-4" style={{ borderLeft: `3px solid ${highlight.color}`, paddingLeft: "8px" }}>
          {highlight.text_content}
        </p>
      </div>

      {/* 批注编辑 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">批注</p>
        {isEditing ? (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="写下你的想法..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { onUpdate(note); setIsEditing(false); }}>
                <Save className="h-3 w-3 mr-1" /> 保存
              </Button>
              {highlight.note && (
                <Button size="sm" variant="outline" onClick={() => { setNote(highlight.note || ""); setIsEditing(false); }}>
                  取消
                </Button>
              )}
            </div>
          </>
        ) : (
          <div
            className="cursor-pointer rounded-md border p-2 text-sm hover:bg-accent"
            onClick={() => setIsEditing(true)}
          >
            {highlight.note || <span className="text-muted-foreground">点击添加批注...</span>}
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3 mr-1" /> 删除
        </Button>
      </div>
    </div>
  );
}
