"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, BookOpen, File, Image, Video, Music, Archive, FileCode, Star, MoreVertical, Trash2, Eye, Share2 } from "lucide-react";
import { cn, formatFileSize, formatRelativeTime } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { FileItem } from "@/types/file";
import { ShareDialog } from "@/components/share/share-dialog";

const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  epub: BookOpen,
  txt: FileText,
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
  document: FileCode,
  other: File,
};

const fileTypeColors: Record<string, string> = {
  pdf: "text-red-500",
  epub: "text-purple-500",
  txt: "text-blue-500",
  image: "text-green-500",
  video: "text-orange-500",
  audio: "text-pink-500",
  archive: "text-yellow-500",
  document: "text-indigo-500",
  other: "text-gray-500",
};

export function FileCard({
  file,
  onChange,
  onPreview,
  listMode = false,
}: {
  file: FileItem;
  onChange?: () => void;
  onPreview?: () => void;
  listMode?: boolean;
}) {
  const Icon = fileTypeIcons[file.file_type] || File;
  const iconColor = fileTypeColors[file.file_type] || "text-gray-500";

  const isReadable = ["pdf", "epub", "txt"].includes(file.file_type);
  const [shareOpen, setShareOpen] = useState(false);

  async function handleToggleFavorite() {
    const res = await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !file.is_favorite }),
    });
    if (res.ok) {
      toast.success(file.is_favorite ? "已取消收藏" : "已收藏");
      onChange?.();
    }
  }

  async function handleDelete() {
    if (!confirm(`确定删除「${file.original_name}」吗？此操作不可恢复。`)) return;
    const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("文件已删除");
      onChange?.();
    } else {
      toast.error("删除失败");
    }
  }

  if (listMode) {
    return (
      <>
        <Card className="flex items-center gap-3 p-3 hover:shadow-md transition-shadow">
          <Icon className={cn("h-8 w-8 flex-shrink-0", iconColor)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{file.original_name}</p>
              {file.is_favorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
              {file.share_token && (
                <Badge variant="outline" className="text-[9px] py-0 px-1 gap-0.5">
                  <Share2 className="h-2.5 w-2.5" /> 已分享
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatFileSize(file.file_size)}</span>
              <span>{formatRelativeTime(file.created_at)}</span>
              <span>{file.view_count} 次查看</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isReadable && (
              <Link href={`/reader/${file.id}`}>
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-1" /> 阅读
                </Button>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleFavorite}>
                  <Star className="mr-2 h-4 w-4" />
                  {file.is_favorite ? "取消收藏" : "收藏"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="mr-2 h-4 w-4" /> 预览
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShareOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" /> 分享
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> 删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          fileId={file.id}
          fileName={file.original_name}
          onShared={() => onChange?.()}
        />
      </>
    );
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-shadow">
      {isReadable ? (
        <Link href={`/reader/${file.id}`}>
          <div className="flex aspect-[3/4] flex-col items-center justify-center p-4 bg-muted/30">
            <Icon className={cn("h-12 w-12 mb-2", iconColor)} />
            <p className="text-xs text-center text-muted-foreground line-clamp-2 break-all">
              {file.original_name}
            </p>
          </div>
        </Link>
      ) : (
        <button onClick={onPreview} className="w-full">
          <div className="flex aspect-[3/4] flex-col items-center justify-center p-4 bg-muted/30">
            <Icon className={cn("h-12 w-12 mb-2", iconColor)} />
            <p className="text-xs text-center text-muted-foreground line-clamp-2 break-all">
              {file.original_name}
            </p>
          </div>
        </button>
      )}
      <div className="p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
          {isReadable && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">可阅读</Badge>
          )}
        </div>
      </div>
      {/* 悬浮操作 */}
      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggleFavorite}>
              <Star className="mr-2 h-4 w-4" />
              {file.is_favorite ? "取消收藏" : "收藏"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPreview}>
              <Eye className="mr-2 h-4 w-4" /> 预览
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShareOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" /> 分享
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> 删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {file.is_favorite && (
        <Star className="absolute left-1 top-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
      )}
      {file.share_token && (
        <Badge variant="outline" className="absolute bottom-1 right-1 text-[9px] py-0 px-1 gap-0.5">
          <Share2 className="h-2.5 w-2.5" /> 已分享
        </Badge>
      )}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        fileId={file.id}
        fileName={file.original_name}
        onShared={() => onChange?.()}
      />
    </Card>
  );
}
