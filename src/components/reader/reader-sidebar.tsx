"use client";

import { useState, useEffect } from "react";
import { Bookmark, List, ChevronRight, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/auth/supabase-browser";
import type { Bookmark as BookmarkType, DocumentFormat } from "@/types/reading";

interface ReaderSidebarProps {
  fileId: string;
  format: DocumentFormat;
  onNavigate: (position: any) => void;
}

export function ReaderSidebar({ fileId, format, onNavigate }: ReaderSidebarProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [outline, setOutline] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"outline" | "bookmarks">("outline");

  async function loadBookmarks() {
    const supabase = createClient();
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("file_id", fileId)
      .order("created_at", { ascending: false });
    if (data) setBookmarks(data);
  }

  useEffect(() => {
    loadBookmarks();

    // 监听目录加载事件
    const handleOutline = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.outline) setOutline(detail.outline);
    };
    const handleBookmarksChange = () => loadBookmarks();
    window.addEventListener("reader-outline-loaded", handleOutline);
    window.addEventListener("reader-bookmarks-change", handleBookmarksChange);
    return () => {
      window.removeEventListener("reader-outline-loaded", handleOutline);
      window.removeEventListener("reader-bookmarks-change", handleBookmarksChange);
    };
  }, [fileId]);

  const handleDeleteBookmark = async (id: string) => {
    const res = await fetch(`/api/reading/bookmarks?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      loadBookmarks();
    }
  };

  return (
    <aside className="w-60 flex-shrink-0 border-r bg-background">
      <div className="flex border-b">
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === "outline" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("outline")}
        >
          目录
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === "bookmarks" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("bookmarks")}
        >
          书签 ({bookmarks.length})
        </button>
      </div>

      <ScrollArea className="h-[calc(100vh-7rem)]">
        {activeTab === "outline" ? (
          <div className="p-2">
            {outline.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                加载目录中...
              </p>
            ) : (
              <OutlineTree items={outline} onNavigate={onNavigate} level={0} />
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {bookmarks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                暂无书签
              </p>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <button
                    className="flex flex-1 items-center gap-2 text-left min-w-0"
                    onClick={() => onNavigate(bm.position)}
                  >
                    <Bookmark className="h-3 w-3 flex-shrink-0 text-primary" />
                    <span className="truncate">{bm.title}</span>
                  </button>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteBookmark(bm.id)}
                    title="删除书签"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

function OutlineTree({
  items,
  onNavigate,
  level,
}: {
  items: any[];
  onNavigate: (pos: any) => void;
  level: number;
}) {
  return (
    <>
      {items.map((item, i) => (
        <div key={i}>
          <button
            className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent text-left"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => onNavigate({ pageNumber: item.pageNumber, cfi: item.cfi, dest: item.dest })}
          >
            <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{item.title || `第 ${i + 1} 节`}</span>
          </button>
          {item.items?.length > 0 && (
            <OutlineTree items={item.items} onNavigate={onNavigate} level={level + 1} />
          )}
        </div>
      ))}
    </>
  );
}
