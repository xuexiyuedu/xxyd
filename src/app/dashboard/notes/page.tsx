"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/auth/supabase-browser";
import { formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Note } from "@/types/reading";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadNotes = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notes")
      .select("*, file:files(original_name), highlight:highlights(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotes(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  function exportAllNotes() {
    const markdown = notes.map(n =>
      `## ${n.title || "笔记"}\n\n` +
      `> 来源：${n.file?.original_name || "未知"}\n` +
      `> 时间：${formatRelativeTime(n.created_at)}\n\n` +
      (n.source_text ? `**摘录：**\n\n> ${n.source_text}\n\n` : "") +
      `${n.content}\n`
    ).join("\n---\n\n");

    const blob = new Blob([`# 我的阅读笔记\n\n${markdown}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `阅读笔记_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出所有笔记");
  }

  const filteredNotes = search
    ? notes.filter(n =>
        n.content?.toLowerCase().includes(search.toLowerCase()) ||
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.source_text?.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">加载笔记...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">笔记中心</h1>
          <p className="text-sm text-muted-foreground mt-1">所有阅读笔记和高亮摘录</p>
        </div>
        <Button variant="outline" onClick={exportAllNotes} disabled={notes.length === 0}>
          <Download className="h-4 w-4 mr-2" /> 导出全部
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索笔记内容..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {notes.length === 0 ? "还没有笔记" : "没有匹配的笔记"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            阅读时添加高亮和批注会自动出现在这里
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                {note.file?.original_name && (
                  <span className="text-xs text-muted-foreground truncate">
                    {note.file.original_name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatRelativeTime(note.created_at)}
                </span>
              </div>

              <h3 className="text-sm font-medium mb-2">{note.title || "笔记"}</h3>

              {note.source_text && (
                <div className="mb-2 rounded-md bg-muted p-2 border-l-2 border-primary">
                  <p className="text-xs italic text-muted-foreground line-clamp-3">
                    {note.source_text}
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground line-clamp-4">
                {note.content || "（无内容）"}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
