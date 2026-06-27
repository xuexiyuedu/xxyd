"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Search, List, StickyNote, Settings, Maximize2,
  Minimize2, BookOpen, BookmarkPlus, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, detectDocumentFormat, formatReadingTime } from "@/lib/utils";
import { PdfReader } from "@/components/reader/pdf/pdf-reader";
import { EpubReader } from "@/components/reader/epub/epub-reader";
import { TxtReader } from "@/components/reader/txt/txt-reader";
import { ReaderSidebar } from "@/components/reader/reader-sidebar";
import { NotesPanel } from "@/components/reading/notes/notes-panel";
import { ReaderSettings as SettingsPanel } from "@/components/reader/reader-settings";
import { useReadingTracker } from "@/hooks/reading/use-reading-tracker";
import type { FileItem } from "@/types/file";
import type { DocumentFormat, ReadingSettings, Highlight } from "@/types/reading";
import { createClient } from "@/lib/auth/supabase-browser";
import Link from "next/link";

interface ReaderContainerProps {
  file: FileItem;
}

export function ReaderContainer({ file }: ReaderContainerProps) {
  const router = useRouter();
  const docFormat = detectDocumentFormat(file.original_name) as DocumentFormat | null;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState<ReadingSettings | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [currentPosition, setCurrentPosition] = useState<any>(null);

  const { readingTime, startTracking, stopTracking, saveProgress } = useReadingTracker({
    fileId: file.id,
    docFormat: docFormat || "pdf",
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // 加载阅读设置
  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const { data } = await supabase
        .from("reading_settings")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();
      if (data) setSettings(data);
    }
    loadSettings();
  }, []);

  // 加载高亮数据
  const loadHighlights = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("highlights")
      .select("*")
      .eq("file_id", file.id)
      .order("created_at", { ascending: false });
    if (data) setHighlights(data as Highlight[]);
  }, [file.id]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  // 开始/停止阅读追踪
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  // 监听阅读位置变化
  useEffect(() => {
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.position) setCurrentPosition(detail.position);
    };
    window.addEventListener("reader-progress-update", handleProgress);
    return () => window.removeEventListener("reader-progress-update", handleProgress);
  }, []);

  // 应用阅读主题
  useEffect(() => {
    if (settings) {
      document.documentElement.setAttribute("data-reader-theme", settings.theme);
    }
    return () => {
      document.documentElement.removeAttribute("data-reader-theme");
    };
  }, [settings]);

  // 全屏控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
      if (e.key === "F11") {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  if (!docFormat) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">不支持的文件格式</p>
        <p className="text-sm text-muted-foreground">
          目前支持 PDF、EPUB、TXT 格式的在线阅读
        </p>
        <Link href="/dashboard/files">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回
          </Button>
        </Link>
      </div>
    );
  }

  const handleHighlightChange = (newHighlights: Highlight[]) => {
    setHighlights(newHighlights);
    loadHighlights();
  };

  const handleAddBookmark = async () => {
    if (!currentPosition) {
      toast.error("尚未定位到当前阅读位置");
      return;
    }
    const title = window.prompt("书签名称", file.original_name) || file.original_name;
    try {
      const res = await fetch("/api/reading/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: file.id,
          title,
          position: currentPosition,
        }),
      });
      if (res.ok) {
        toast.success("书签已添加");
        window.dispatchEvent(new CustomEvent("reader-bookmarks-change"));
      } else {
        toast.error("添加书签失败");
      }
    } catch {
      toast.error("添加书签失败");
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-screen flex-col bg-background",
        isFullscreen && "fixed inset-0 z-50"
      )}
    >
      {/* 顶部工具栏 */}
      <header className={cn(
        "flex h-12 items-center gap-2 border-b px-4",
        isFullscreen && "opacity-0 hover:opacity-100 transition-opacity absolute top-0 left-0 right-0 bg-background z-10"
      )}>
        <Link href="/dashboard/files">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm font-medium truncate max-w-xs md:max-w-md">
          {file.original_name}
        </span>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-xs text-muted-foreground">
          阅读 {formatReadingTime(readingTime)}
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleAddBookmark}
          title="添加书签"
        >
          <BookmarkPlus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setNotesPanelOpen(!notesPanelOpen)}
        >
          <StickyNote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </header>

      {/* 主体三栏布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧目录栏 */}
        {sidebarOpen && !isFullscreen && (
          <ReaderSidebar
            fileId={file.id}
            format={docFormat}
            onNavigate={(position) => {
              // 触发阅读器跳转
              window.dispatchEvent(new CustomEvent("reader-navigate", { detail: position }));
            }}
          />
        )}

        {/* 主阅读区 */}
        <div className="flex-1 overflow-hidden reader-content">
          {docFormat === "pdf" && (
            <PdfReader
              fileId={file.id}
              highlights={highlights}
              onHighlightsChange={handleHighlightChange}
              settings={settings}
            />
          )}
          {docFormat === "epub" && (
            <EpubReader
              fileId={file.id}
              highlights={highlights}
              onHighlightsChange={handleHighlightChange}
              settings={settings}
            />
          )}
          {docFormat === "txt" && (
            <TxtReader
              fileId={file.id}
              highlights={highlights}
              onHighlightsChange={handleHighlightChange}
              settings={settings}
            />
          )}
        </div>

        {/* 右侧笔记/批注面板 */}
        {notesPanelOpen && (
          <NotesPanel
            fileId={file.id}
            highlights={highlights}
            onHighlightUpdate={handleHighlightChange}
          />
        )}
      </div>

      {/* 设置面板 */}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
