"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextSelectionToolbar } from "@/components/reader/pdf/text-selection-toolbar";
import type { Highlight, ReadingSettings, HighlightColor } from "@/types/reading";

// 动态加载 epub.js
let epubjs: any = null;

interface EpubReaderProps {
  fileId: string;
  highlights: Highlight[];
  onHighlightsChange: (highlights: Highlight[]) => void;
  settings: ReadingSettings | null;
}

export function EpubReader({ fileId, highlights, onHighlightsChange, settings }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [currentChapter, setCurrentChapter] = useState("");
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [toc, setToc] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      if (!viewerRef.current) return;

      // 动态加载 epub.js
      if (!epubjs) {
        epubjs = await import("epubjs");
      }

      // 获取文件 URL
      const res = await fetch(`/api/files/${fileId}/preview`);
      const data = await res.json();
      if (!res.ok) return;

      // 初始化 Book
      const book = epubjs.default(data.url);
      bookRef.current = book;

      // 渲染
      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        spread: "none",
        flow: "paginated",
      });
      renditionRef.current = rendition;

      // 显示
      await rendition.display();

      // 加载目录
      const navigation = await book.loaded.navigation;
      const tocItems = navigation.toc.map((item: any) => ({
        title: item.label.trim(),
        cfi: item.href,
        items: [],
      }));
      setToc(tocItems);
      window.dispatchEvent(new CustomEvent("reader-outline-loaded", {
        detail: { outline: tocItems },
      }));

      // 应用主题
      if (settings) {
        applyTheme(settings);
      }

      // 监听文本选择
      rendition.on("selected", (cfiRange: string, contents: any) => {
        const selection = contents.window.getSelection();
        const text = selection?.toString() || "";
        if (text.trim()) {
          const range = selection?.getRangeAt(0);
          const rect = range?.getBoundingClientRect();
          if (rect) {
            setSelectionRect(rect);
            // 存储 cfiRange 供后续使用
            (setSelectionRect as any).cfiRange = cfiRange;
            (setSelectionRect as any).text = text;
          }
        }
      });

      // 监听位置变化
      rendition.on("relocated", (location: any) => {
        const cfi = location.start.cfi;
        const progress = book.locations.percentageFromCfi(cfi) * 100;
        window.dispatchEvent(new CustomEvent("reader-progress-update", {
          detail: { position: { cfi }, progress: Math.round(progress) },
        }));
      });

      // 生成 locations（用于进度计算）
      await book.ready;
      await book.locations.generate(1600);
    }

    init();

    return () => {
      if (renditionRef.current) renditionRef.current.destroy();
      if (bookRef.current) bookRef.current.destroy();
    };
  }, [fileId]);

  // 应用主题
  const applyTheme = (settings: ReadingSettings) => {
    if (!renditionRef.current) return;
    const themes = renditionRef.current.themes;

    const themeColors: Record<string, { bg: string; text: string }> = {
      light: { bg: "#FFFFFF", text: "#1A1A1A" },
      sepia: { bg: "#F4ECD8", text: "#5B4636" },
      dark: { bg: "#1A1A1A", text: "#E8E8E8" },
      green: { bg: "#CCE8CF", text: "#2C3E50" },
    };

    const colors = themeColors[settings.theme] || themeColors.light;

    themes.register("custom", {
      body: {
        background: colors.bg,
        color: colors.text,
        "font-size": `${settings.font_size}px`,
        "line-height": settings.line_height,
        "letter-spacing": `${settings.letter_spacing}px`,
        "font-family": settings.font_family,
      },
    });
    themes.select("custom");
  };

  // 翻页
  const prevPage = () => renditionRef.current?.prev();
  const nextPage = () => renditionRef.current?.next();

  // 添加高亮
  const addHighlight = async (color: HighlightColor, type: "highlight" | "underline" = "highlight") => {
    const cfiRange = (setSelectionRect as any).cfiRange;
    const text = (setSelectionRect as any).text;
    if (!cfiRange || !text) return;

    // 在 rendition 上添加高亮
    renditionRef.current?.annotations.add("highlight", cfiRange, {}, undefined, "", { fill: color });

    // 保存到数据库
    const { createClient } = await import("@/lib/auth/supabase-browser");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("highlights").insert({
      user_id: user.id,
      file_id: fileId,
      document_format: "epub",
      highlight_type: type,
      color,
      position: { cfiRange },
      text_content: text,
    }).select().single();

    if (data) {
      onHighlightsChange([...highlights, data as Highlight]);
      toast.success("已添加高亮");
    }

    // 清除选择
    renditionRef.current?.contents.window.getSelection()?.removeAllRanges();
    setSelectionRect(null);
  };

  // 恢复已有高亮
  useEffect(() => {
    if (renditionRef.current && highlights.length > 0) {
      highlights.forEach((hl) => {
        if (hl.document_format === "epub" && hl.position.cfiRange) {
          renditionRef.current.annotations.add(
            "highlight",
            hl.position.cfiRange,
            {},
            undefined,
            "",
            { fill: hl.color }
          );
        }
      });
    }
  }, [highlights]);

  // 监听导航
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.cfi && renditionRef.current) {
        renditionRef.current.display(detail.cfi);
      }
    };
    window.addEventListener("reader-navigate", handleNavigate);
    return () => window.removeEventListener("reader-navigate", handleNavigate);
  }, []);

  // 应用设置变化
  useEffect(() => {
    if (settings) applyTheme(settings);
  }, [settings]);

  return (
    <div className="flex h-full flex-col">
      <div ref={viewerRef} className="epub-reader-container flex-1" />

      {/* 选中文本工具条 */}
      {selectionRect && (
        <TextSelectionToolbar
          rect={selectionRect}
          onHighlight={addHighlight}
          onUnderline={(c) => addHighlight(c, "underline")}
          onCopy={() => {
            navigator.clipboard.writeText((setSelectionRect as any).text || "");
            toast.success("已复制");
          }}
        />
      )}

      {/* 底部控制 */}
      <div className="flex items-center justify-center gap-4 border-t bg-background px-4 py-2">
        <Button variant="outline" size="icon" onClick={prevPage}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">{currentChapter}</span>
        <Button variant="outline" size="icon" onClick={nextPage}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
