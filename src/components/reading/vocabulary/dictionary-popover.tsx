"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Loader2, Plus, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DictionaryResult {
  translation: string;
  phonetic?: string | null;
  definition?: string | null;
  examples?: string[];
}

interface DictionaryPopoverProps {
  word: string;
  context?: string;
  fileId?: string;
  onClose?: () => void;
}

export function DictionaryPopover({ word, context, fileId, onClose }: DictionaryPopoverProps) {
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/reading/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: word, to: "zh" }),
    })
      .then((res) => res.json())
      .then((data) => {
        setResult({
          translation: data.translation || "",
          phonetic: data.phonetic,
          definition: data.definition,
          examples: data.examples,
        });
      })
      .catch(() => {
        setResult({ translation: "查询失败，请稍后重试" });
      })
      .finally(() => setLoading(false));
  }, [word]);

  const playPronunciation = () => {
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = /^[\u4e00-\u9fa5]/.test(word) ? "zh-CN" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const addToVocabulary = async () => {
    if (!result) return;
    try {
      const res = await fetch("/api/reading/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          translation: result.translation,
          definition: result.definition,
          context,
          file_id: fileId,
          language: /^[\u4e00-\u9fa5]/.test(word) ? "zh" : "en",
        }),
      });
      if (res.ok) {
        setAdded(true);
        toast.success("已加入生词本");
      } else {
        toast.error("加入生词本失败");
      }
    } catch {
      toast.error("加入生词本失败");
    }
  };

  return (
    <div className="w-72 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-base font-semibold">{word}</h4>
          {result?.phonetic && (
            <p className="text-xs text-muted-foreground">/{result.phonetic}/</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={playPronunciation} title="发音">
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="关闭">
            ×
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="text-sm">
            <p className="font-medium text-primary">{result?.translation}</p>
            {result?.definition && (
              <p className="text-xs text-muted-foreground mt-1">{result.definition}</p>
            )}
          </div>

          {result?.examples && result.examples.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">例句</p>
              {result.examples.map((ex, i) => (
                <p key={i} className="text-xs text-muted-foreground line-clamp-2">{ex}</p>
              ))}
            </div>
          )}

          <Button
            size="sm"
            className="w-full"
            disabled={added}
            onClick={addToVocabulary}
          >
            {added ? (
              <>
                <BookOpenCheck className="h-4 w-4 mr-1" /> 已加入
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> 加入生词本
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
