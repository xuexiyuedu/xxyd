"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Trash2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/auth/supabase-browser";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Vocabulary } from "@/types/reading";

const PROFICIENCY_LABELS = ["生疏", "熟悉", "掌握"];
const PROFICIENCY_COLORS = ["bg-red-100 text-red-700", "bg-yellow-100 text-yellow-700", "bg-green-100 text-green-700"];

export function VocabularyList() {
  const [words, setWords] = useState<Vocabulary[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "due" | "mastered">("all");

  const loadWords = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("vocabulary")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (filter === "mastered") {
      query = query.eq("proficiency", 2);
    }

    const { data } = await query;
    setWords(data || []);
  }, [filter]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  async function deleteWord(id: string) {
    const supabase = createClient();
    await supabase.from("vocabulary").delete().eq("id", id);
    setWords(words.filter(w => w.id !== id));
    toast.success("已删除");
  }

  async function updateProficiency(id: string, proficiency: 0 | 1 | 2) {
    const supabase = createClient();
    await supabase.from("vocabulary").update({ proficiency }).eq("id", id);
    setWords(words.map(w => w.id === id ? { ...w, proficiency } : w));
  }

  const filteredWords = search
    ? words.filter(w =>
        w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.definition?.toLowerCase().includes(search.toLowerCase()) ||
        w.translation?.toLowerCase().includes(search.toLowerCase())
      )
    : words;

  return (
    <div className="space-y-4">
      {/* 搜索和过滤 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索单词..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "due", "mastered"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "全部" : f === "due" ? "待复习" : "已掌握"}
            </Button>
          ))}
        </div>
      </div>

      {/* 单词列表 */}
      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="space-y-2 pr-2">
          {filteredWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Brain className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">暂无生词</p>
              <p className="text-xs text-muted-foreground mt-1">阅读时选中文本后可收藏生词</p>
            </div>
          ) : (
            filteredWords.map((word) => (
              <Card key={word.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{word.word}</h3>
                      {word.phonetic && (
                        <span className="text-sm text-muted-foreground">/{word.phonetic}/</span>
                      )}
                      <Badge className={`text-xs ${PROFICIENCY_COLORS[word.proficiency]}`}>
                        {PROFICIENCY_LABELS[word.proficiency]}
                      </Badge>
                    </div>
                    {word.translation && (
                      <p className="text-sm text-muted-foreground mb-1">{word.translation}</p>
                    )}
                    {word.definition && (
                      <p className="text-sm mb-1">{word.definition}</p>
                    )}
                    {word.context && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 mt-2">
                        {word.context}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatRelativeTime(word.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <select
                      className="text-xs rounded border px-1 py-0.5"
                      value={word.proficiency}
                      onChange={(e) => updateProficiency(word.id, parseInt(e.target.value) as 0 | 1 | 2)}
                    >
                      <option value={0}>生疏</option>
                      <option value={1}>熟悉</option>
                      <option value={2}>掌握</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteWord(word.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
