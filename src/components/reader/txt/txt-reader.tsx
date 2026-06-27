"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TextSelectionToolbar } from "@/components/reader/pdf/text-selection-toolbar";
import { DictionaryPopover } from "@/components/reading/vocabulary/dictionary-popover";
import { cn } from "@/lib/utils";
import type { Highlight, ReadingSettings, HighlightColor } from "@/types/reading";

interface TxtReaderProps {
  fileId: string;
  highlights: Highlight[];
  onHighlightsChange: (highlights: Highlight[]) => void;
  settings: ReadingSettings | null;
}

export function TxtReader({ fileId, highlights, onHighlightsChange, settings }: TxtReaderProps) {
  const [content, setContent] = useState<string>("");
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [chapters, setChapters] = useState<{ title: string; index: number }[]>([]);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<{ paragraphIndex: number; startOffset: number; endOffset: number; text: string } | null>(null);
  const [dictionaryText, setDictionaryText] = useState<string>("");
  const [dictionaryPos, setDictionaryPos] = useState<{ left: number; top: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // 加载文件内容
  useEffect(() => {
    async function loadContent() {
      const res = await fetch(`/api/files/${fileId}/preview`);
      const data = await res.json();
      if (!res.ok) return;

      // 下载文件内容
      const textRes = await fetch(data.url);
      const buffer = await textRes.arrayBuffer();

      // 编码检测
      let text = "";
      try {
        text = new TextDecoder("utf-8").decode(buffer);
        if (text.includes("�")) throw new Error("编码不是UTF-8");
      } catch {
        try {
          text = new TextDecoder("gbk").decode(buffer);
        } catch {
          text = new TextDecoder("utf-8").decode(buffer);
        }
      }

      setContent(text);

      // 按段落分割
      const paras = text.split(/\n+/).filter((p) => p.trim());
      setParagraphs(paras);

      // 检测章节
      const chapterRegex = /^(第[一二三四五六七八九十百千\d]+[章节回卷]|Chapter\s+\d+|CHAPTER\s+\d+)/i;
      const chaps: { title: string; index: number }[] = [];
      paras.forEach((p, i) => {
        if (chapterRegex.test(p.trim())) {
          chaps.push({ title: p.trim().slice(0, 50), index: i });
        }
      });
      setChapters(chaps);

      if (chaps.length > 0) {
        window.dispatchEvent(new CustomEvent("reader-outline-loaded", {
          detail: { outline: chaps.map(c => ({ title: c.title, pageNumber: c.index, items: [] })) },
        }));
      }
    }

    loadContent();
  }, [fileId]);

  // 文本选择事件
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim() || !scrollRef.current) {
        setSelectionRect(null);
        return;
      }

      const text = selection.toString();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0) return;

      // 找到选区所在的段落
      let container = range.commonAncestorContainer;
      while (container && container.nodeName !== "P") {
        container = container.parentElement!;
      }
      if (!container) return;

      const paragraphIndex = parseInt((container as HTMLElement).getAttribute("data-paragraph-index") || "0");
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      setSelectionRect(rect);
      setSelectionInfo({ paragraphIndex, startOffset, endOffset, text });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // 添加高亮
  const addHighlight = async (color: HighlightColor, type: "highlight" | "underline" = "highlight") => {
    if (!selectionInfo) return;

    const { createClient } = await import("@/lib/auth/supabase-browser");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("highlights").insert({
      user_id: user.id,
      file_id: fileId,
      document_format: "txt",
      highlight_type: type,
      color,
      position: {
        paragraphIndex: selectionInfo.paragraphIndex,
        startOffset: selectionInfo.startOffset,
        endOffset: selectionInfo.endOffset,
      },
      text_content: selectionInfo.text,
    }).select().single();

    if (data) {
      onHighlightsChange([...highlights, data as Highlight]);
      toast.success("已添加高亮");
    }

    window.getSelection()?.removeAllRanges();
    setSelectionRect(null);
    setSelectionInfo(null);
  };

  // 搜索
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const results: number[] = [];
    paragraphs.forEach((p, i) => {
      if (p.includes(searchQuery)) results.push(i);
    });
    setSearchResults(results);
    setCurrentSearchIndex(0);
    if (results.length > 0) {
      scrollToParagraph(results[0]);
    }
  };

  const scrollToParagraph = (index: number) => {
    paragraphRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navigateSearch = (dir: "next" | "prev") => {
    if (searchResults.length === 0) return;
    let newIndex = currentSearchIndex + (dir === "next" ? 1 : -1);
    if (newIndex >= searchResults.length) newIndex = 0;
    if (newIndex < 0) newIndex = searchResults.length - 1;
    setCurrentSearchIndex(newIndex);
    scrollToParagraph(searchResults[newIndex]);
  };

  // 监听导航
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.pageNumber !== undefined) {
        scrollToParagraph(detail.pageNumber);
      }
    };
    window.addEventListener("reader-navigate", handleNavigate);
    return () => window.removeEventListener("reader-navigate", handleNavigate);
  }, [paragraphs]);

  // 进度更新
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const scrollTop = scrollRef.current.scrollTop;
      const scrollHeight = scrollRef.current.scrollHeight;
      const progress = Math.round((scrollTop / scrollHeight) * 100);
      window.dispatchEvent(new CustomEvent("reader-progress-update", {
        detail: { position: { scrollTop, paragraphIndex: currentChapter }, progress },
      }));
    };
    scrollRef.current?.addEventListener("scroll", handleScroll);
    return () => scrollRef.current?.removeEventListener("scroll", handleScroll);
  }, [currentChapter]);

  // 获取段落的高亮
  const getParagraphHighlights = (paraIndex: number) => {
    return highlights.filter(h =>
      h.document_format === "txt" &&
      h.position.paragraphIndex === paraIndex
    );
  };

  // 主题样式
  const themeColors: Record<string, { bg: string; text: string }> = {
    light: { bg: "#FFFFFF", text: "#1A1A1A" },
    sepia: { bg: "#F4ECD8", text: "#5B4636" },
    dark: { bg: "#1A1A1A", text: "#E8E8E8" },
    green: { bg: "#CCE8CF", text: "#2C3E50" },
  };
  const colors = themeColors[settings?.theme || "light"] || themeColors.light;

  return (
    <div className="flex h-full flex-col">
      {/* 搜索栏 */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Input
          placeholder="搜索内容..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="h-8 w-48"
        />
        <Button size="sm" variant="outline" onClick={handleSearch}>
          <Search className="h-3 w-3" />
        </Button>
        {searchResults.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">
              {currentSearchIndex + 1}/{searchResults.length}
            </span>
            <Button size="sm" variant="ghost" onClick={() => navigateSearch("prev")}>
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigateSearch("next")}>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      {/* 文本内容 */}
      <ScrollArea className="flex-1 reader-content" style={{ backgroundColor: colors.bg, color: colors.text }}>
        <div
          ref={scrollRef}
          className="mx-auto max-w-2xl px-6 py-8"
          style={{
            fontSize: `${settings?.font_size || 16}px`,
            lineHeight: settings?.line_height || 1.6,
            fontFamily: settings?.font_family || "system-ui",
          }}
        >
          {paragraphs.map((para, i) => {
            const paraHighlights = getParagraphHighlights(i);
            const isSearchResult = searchResults.includes(i);
            const isCurrentSearch = searchResults[currentSearchIndex] === i;

            return (
              <p
                key={i}
                ref={(el) => { paragraphRefs.current[i] = el; }}
                data-paragraph-index={i}
                className={cn(
                  "mb-3 text-justify",
                  isCurrentSearch && "bg-yellow-200/50 rounded px-1",
                  isSearchResult && !isCurrentSearch && "bg-yellow-100/30 rounded px-1"
                )}
              >
                {renderParagraphWithHighlights(para, paraHighlights, searchQuery, isCurrentSearch)}
              </p>
            );
          })}
        </div>
      </ScrollArea>

      {/* 选中文本工具条 */}
      {selectionRect && (
        <TextSelectionToolbar
          rect={selectionRect}
          onHighlight={addHighlight}
          onUnderline={(c) => addHighlight(c, "underline")}
          onCopy={() => {
            navigator.clipboard.writeText(selectionInfo?.text || "");
            toast.success("已复制");
          }}
          onTranslate={async () => {
            const text = selectionInfo?.text || window.getSelection()?.toString().trim() || "";
            if (!text) return;
            try {
              const res = await fetch("/api/reading/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, from: "auto", to: "zh" }),
              });
              const data = await res.json();
              if (data.translation) {
                toast.success(`翻译：${data.translation}`);
              } else {
                toast.error("翻译失败");
              }
            } catch {
              toast.error("翻译请求失败");
            }
          }}
          onDictionary={() => {
            const text = window.getSelection()?.toString().trim() || selectionInfo?.text || "";
            if (text) {
              setDictionaryText(text);
              setDictionaryPos({
                left: selectionRect.left + selectionRect.width / 2,
                top: selectionRect.top - 8,
              });
            }
          }}
        />
      )}

      {/* 查词弹窗 */}
      {dictionaryText && dictionaryPos && (
        <div
          className="fixed z-[1001] bg-popover border rounded-lg shadow-lg"
          style={{
            left: dictionaryPos.left,
            top: dictionaryPos.top,
            transform: "translate(-50%, -100%)",
          }}
        >
          <DictionaryPopover
            word={dictionaryText}
            fileId={fileId}
            onClose={() => {
              setDictionaryText("");
              setDictionaryPos(null);
              window.getSelection()?.removeAllRanges();
              setSelectionRect(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 渲染段落文本，应用高亮和搜索标记
 */
function renderParagraphWithHighlights(
  text: string,
  highlights: Highlight[],
  searchQuery: string,
  isCurrentSearch: boolean
): React.ReactNode {
  if (highlights.length === 0 && !searchQuery) {
    return text;
  }

  // 收集所有需要标记的位置
  const marks: Array<{ start: number; end: number; color: string; type: string }> = [];

  highlights.forEach((hl) => {
    if (hl.position.startOffset !== undefined && hl.position.endOffset !== undefined) {
      marks.push({
        start: hl.position.startOffset,
        end: hl.position.endOffset,
        color: hl.color,
        type: hl.highlight_type,
      });
    }
  });

  // 搜索匹配
  if (searchQuery) {
    let idx = text.indexOf(searchQuery);
    while (idx !== -1) {
      marks.push({
        start: idx,
        end: idx + searchQuery.length,
        color: isCurrentSearch ? "#FFEB3B" : "#FFF9C4",
        type: "highlight",
      });
      idx = text.indexOf(searchQuery, idx + 1);
    }
  }

  // 按起始位置排序
  marks.sort((a, b) => a.start - b.start);

  // 渲染
  const result: React.ReactNode[] = [];
  let lastEnd = 0;

  marks.forEach((mark, i) => {
    if (mark.start > lastEnd) {
      result.push(text.slice(lastEnd, mark.start));
    }
    const markedText = text.slice(mark.start, mark.end);
    const style: React.CSSProperties = {};

    if (mark.type === "highlight") {
      style.backgroundColor = mark.color + "60";
    } else if (mark.type === "underline") {
      style.borderBottom = `2px solid ${mark.color}`;
    } else if (mark.type === "strikethrough") {
      style.textDecoration = `line-through ${mark.color}`;
    }

    result.push(
      <span key={i} style={style}>
        {markedText}
      </span>
    );
    lastEnd = mark.end;
  });

  if (lastEnd < text.length) {
    result.push(text.slice(lastEnd));
  }

  return result;
}
