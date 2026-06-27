"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StickyNote, Plus, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/auth/supabase-browser";
import { toast } from "sonner";
import type { Highlight, Note } from "@/types/reading";

interface NotesPanelProps {
  fileId: string;
  highlights: Highlight[];
  onHighlightUpdate: (highlights: Highlight[]) => void;
}

export function NotesPanel({ fileId, highlights, onHighlightUpdate }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"highlights" | "notes">("highlights");

  useEffect(() => {
    loadNotes();
  }, [fileId]);

  async function loadNotes() {
    const supabase = createClient();
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("file_id", fileId)
      .order("created_at", { ascending: false });
    if (data) setNotes(data);
  }

  async function deleteHighlight(id: string) {
    const supabase = createClient();
    await supabase.from("highlights").delete().eq("id", id);
    onHighlightUpdate(highlights.filter(h => h.id !== id));
    toast.success("已删除");
  }

  async function addNoteFromHighlight(highlight: Highlight) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("notes").insert({
      user_id: user.id,
      file_id: fileId,
      highlight_id: highlight.id,
      title: "摘录笔记",
      content: "",
      source_text: highlight.text_content,
      source_position: highlight.position,
      tags: [],
    }).select().single();

    if (data) {
      setNotes([data, ...notes]);
      toast.success("已创建笔记");
    }
  }

  async function exportNotes() {
    const allNotes = activeTab === "highlights"
      ? highlights.map(h => `## 摘录\n\n> ${h.text_content}\n\n${h.note ? `**批注：** ${h.note}\n` : ""}`)
      : notes.map(n => `## ${n.title || "笔记"}\n\n${n.content}\n${n.source_text ? `\n> 摘录：${n.source_text}\n` : ""}`);

    const markdown = `# 阅读笔记\n\n${allNotes.join("\n\n---\n\n")}`;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `笔记_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出笔记");
  }

  const filteredHighlights = search
    ? highlights.filter(h =>
        h.text_content?.toLowerCase().includes(search.toLowerCase()) ||
        h.note?.toLowerCase().includes(search.toLowerCase())
      )
    : highlights;

  const filteredNotes = search
    ? notes.filter(n =>
        n.content?.toLowerCase().includes(search.toLowerCase()) ||
        n.title?.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  return (
    <aside className="w-80 flex-shrink-0 border-l bg-background flex flex-col">
      {/* 标签栏 */}
      <div className="flex border-b">
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === "highlights" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("highlights")}
        >
          高亮 ({highlights.length})
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === "notes" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("notes")}
        >
          笔记 ({notes.length})
        </button>
      </div>

      {/* 搜索和导出 */}
      <div className="flex items-center gap-2 p-2 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={exportNotes}>
          <Download className="h-3 w-3" />
        </Button>
      </div>

      {/* 内容列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {activeTab === "highlights" ? (
            filteredHighlights.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                暂无高亮，选中文本后添加
              </p>
            ) : (
              filteredHighlights.map((hl) => (
                <div key={hl.id} className="rounded-md border p-2 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-2">
                    <div
                      className="mt-1 h-3 w-3 flex-shrink-0 rounded"
                      style={{ backgroundColor: hl.color + "60" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs line-clamp-3" style={{ color: "var(--reader-text, #1A1A1A)" }}>
                        {hl.text_content}
                      </p>
                      {hl.note && (
                        <p className="mt-1 text-xs text-muted-foreground italic line-clamp-2">
                          {hl.note}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(hl.created_at)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => addNoteFromHighlight(hl)}
                          >
                            转笔记
                          </button>
                          <button
                            className="text-[10px] text-destructive hover:underline"
                            onClick={() => deleteHighlight(hl.id)}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                暂无笔记
              </p>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="rounded-md border p-3 hover:shadow-sm transition-shadow">
                  <p className="text-sm font-medium mb-1">{note.title || "笔记"}</p>
                  {note.source_text && (
                    <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2 border-l-2 border-muted pl-2">
                      {note.source_text}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-4">{note.content}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {formatRelativeTime(note.created_at)}
                  </span>
                </div>
              ))
            )
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
