"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TextSelectionToolbar } from "@/components/reader/pdf/text-selection-toolbar";
import { PdfHighlighter } from "@/components/reader/pdf/pdf-highlighter";
import { AnnotationCard } from "@/components/reader/pdf/annotation-card";
import { DictionaryPopover } from "@/components/reading/vocabulary/dictionary-popover";
import { usePdfDocument, pdfjsLib } from "@/hooks/reading/use-pdf-document";
import type { Highlight, ReadingSettings, HighlightColor } from "@/types/reading";
import { cn } from "@/lib/utils";

interface PdfReaderProps {
  fileId: string;
  highlights: Highlight[];
  onHighlightsChange: (highlights: Highlight[]) => void;
  settings: ReadingSettings | null;
}

const HIGHLIGHT_COLORS: HighlightColor[] = ["#FFEB3B", "#A5D6A7", "#90CAF9", "#F48FB1", "#CE93D8"];

export function PdfReader({ fileId, highlights, onHighlightsChange, settings }: PdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [dictionaryText, setDictionaryText] = useState<string | null>(null);
  const [dictionaryPos, setDictionaryPos] = useState<{ left: number; top: number } | null>(null);
  const { pdfDoc, isLoading } = usePdfDocument(fileId);

  // 渲染当前页
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")!;

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const renderContext = {
      canvasContext: context,
      viewport,
    };

    await page.render(renderContext).promise;

    // 渲染文本层（支持选择）
    if (textLayerRef.current) {
      const textContent = await page.getTextContent();
      textLayerRef.current.innerHTML = "";
      textLayerRef.current.style.width = `${viewport.width}px`;
      textLayerRef.current.style.height = `${viewport.height}px`;

      textContent.items.forEach((item: any) => {
        const tx = pdfjsLib.Util.transform(
          pdfjsLib.Util.transform(viewport.transform, item.transform),
          [1, 0, 0, -1, 0, 0]
        );

        const span = document.createElement("span");
        span.textContent = item.str;
        span.style.position = "absolute";
        span.style.left = `${tx[4]}px`;
        span.style.top = `${tx[5]}px`;
        span.style.fontSize = `${item.height * scale}px`;
        span.style.fontFamily = item.fontName;
        span.style.transform = "scaleX(1)";
        textLayerRef.current!.appendChild(span);
      });
    }

    // 通知目录加载
    if (pageNum === 1) {
      const outline = await pdfDoc.getOutline();
      if (outline) {
        window.dispatchEvent(new CustomEvent("reader-outline-loaded", {
          detail: { outline: outline.map((o: any) => ({
            title: o.title,
            dest: o.dest,
            items: o.items || [],
          })) },
        }));
      }
    }
  }, [pdfDoc, scale]);

  // 初次加载和页码变化时渲染
  useEffect(() => {
    if (pdfDoc) {
      setTotalPages(pdfDoc.numPages);
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  // 监听导航事件
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.pageNumber) {
        setCurrentPage(detail.pageNumber);
      }
    };
    window.addEventListener("reader-navigate", handleNavigate);
    return () => window.removeEventListener("reader-navigate", handleNavigate);
  }, []);

  // 文本选择事件
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() && textLayerRef.current) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setSelectionRect(rect);
        }
      } else {
        setSelectionRect(null);
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // 保存阅读进度
  useEffect(() => {
    if (pdfDoc && totalPages > 0) {
      const progress = Math.round((currentPage / totalPages) * 100);
      window.dispatchEvent(new CustomEvent("reader-progress-update", {
        detail: { position: { pageNumber: currentPage, zoom: scale }, progress },
      }));
    }
  }, [currentPage, scale, totalPages, pdfDoc]);

  // 添加高亮
  const addHighlight = async (color: HighlightColor, type: "highlight" | "underline" = "highlight") => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;

    const text = selection.toString();
    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects()).map(r => ({
      x: (r.left - (textLayerRef.current?.getBoundingClientRect().left || 0)) / scale,
      y: (r.top - (textLayerRef.current?.getBoundingClientRect().top || 0)) / scale,
      width: r.width / scale,
      height: r.height / scale,
    }));

    const supabase = (await import("@/lib/auth/supabase-browser")).createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("highlights")
      .insert({
        user_id: user.id,
        file_id: fileId,
        document_format: "pdf",
        highlight_type: type,
        color,
        position: { pageNumber: currentPage, rects },
        text_content: text,
      })
      .select()
      .single();

    if (data) {
      onHighlightsChange([...highlights, data as Highlight]);
      toast.success("已添加高亮");
    }
    if (error) toast.error("添加高亮失败");

    selection.removeAllRanges();
    setSelectionRect(null);
  };

  // 删除高亮
  const deleteHighlight = async (id: string) => {
    const supabase = (await import("@/lib/auth/supabase-browser")).createClient();
    await supabase.from("highlights").delete().eq("id", id);
    onHighlightsChange(highlights.filter(h => h.id !== id));
    setSelectedHighlight(null);
    toast.success("已删除高亮");
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载 PDF 中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* PDF 渲染区 */}
      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center p-4">
        <div className="relative" style={{ width: "fit-content" }}>
          <canvas ref={canvasRef} className="shadow-lg" />
          <div ref={textLayerRef} className="pdf-text-layer" />

          {/* 高亮层 */}
          <PdfHighlighter
            highlights={highlights.filter(h => h.position.pageNumber === currentPage)}
            scale={scale}
            onHighlightClick={setSelectedHighlight}
          />

          {/* 选中文本工具条 */}
          {selectionRect && !dictionaryText && (
            <TextSelectionToolbar
              rect={selectionRect}
              onHighlight={(color) => addHighlight(color)}
              onUnderline={(color) => addHighlight(color, "underline")}
              onCopy={() => {
                navigator.clipboard.writeText(window.getSelection()?.toString() || "");
                toast.success("已复制");
              }}
              onDictionary={() => {
                const text = window.getSelection()?.toString().trim() || "";
                if (text) {
                  setDictionaryText(text);
                  setDictionaryPos({ left: selectionRect.left + selectionRect.width / 2, top: selectionRect.top - 8 });
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
                  setDictionaryText(null);
                  setDictionaryPos(null);
                  window.getSelection()?.removeAllRanges();
                  setSelectionRect(null);
                }}
              />
            </div>
          )}

          {/* 批注卡片 */}
          {selectedHighlight && (
            <AnnotationCard
              highlight={selectedHighlight}
              onClose={() => setSelectedHighlight(null)}
              onDelete={() => deleteHighlight(selectedHighlight.id)}
              onUpdate={async (note) => {
                const supabase = (await import("@/lib/auth/supabase-browser")).createClient();
                await supabase.from("highlights").update({ note }).eq("id", selectedHighlight.id);
                onHighlightsChange(highlights.map(h =>
                  h.id === selectedHighlight.id ? { ...h, note } : h
                ));
                setSelectedHighlight(null);
                toast.success("批注已保存");
              }}
            />
          )}
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="flex items-center justify-center gap-4 border-t bg-background px-4 py-2">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm tabular-nums">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 ml-4">
          <Button variant="ghost" size="icon" onClick={() => setScale(Math.max(0.5, scale - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale(Math.min(4, scale + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
