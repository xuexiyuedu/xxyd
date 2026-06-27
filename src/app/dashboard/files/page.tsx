"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { DropZone } from "@/components/upload/drop-zone";
import { FileCard } from "@/components/files/file-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Search, Grid3x3, List, Star } from "lucide-react";
import { toast } from "sonner";
import { FileViewer } from "@/components/preview/file-viewer";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/types/file";

export default function FilesPage() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "24",
        search,
        favorite: String(favoriteOnly),
      });
      const res = await fetch(`/api/files?${params}`);
      const data = await res.json();
      setFiles(data.files || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, favoriteOnly]);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user, fetchFiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFiles();
  };

  const openPreview = async (file: FileItem) => {
    try {
      const res = await fetch(`/api/files/${file.id}/preview`);
      const data = await res.json();
      if (data.url) {
        setPreviewUrl(data.url);
        setPreviewFile(file);
      }
    } catch {
      toast?.error?.("预览链接获取失败");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">资料管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理你的电子资料和学习文档</p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文件..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48 md:w-64"
            />
          </form>
          <Button
            variant={favoriteOnly ? "default" : "outline"}
            size="icon"
            onClick={() => { setFavoriteOnly(!favoriteOnly); setPage(1); }}
          >
            <Star className={cn("h-4 w-4", favoriteOnly && "fill-current")} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          </Button>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" /> 上传文件
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>上传文件</DialogTitle>
              </DialogHeader>
              <DropZone onUploadComplete={fetchFiles} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 文件列表 */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-muted-foreground mb-4">
            <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>还没有文件，点击「上传文件」开始吧</p>
          </div>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>上传第一个文件</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>上传文件</DialogTitle>
              </DialogHeader>
              <DropZone onUploadComplete={fetchFiles} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {files.map((file) => (
                <FileCard key={file.id} file={file} onChange={fetchFiles} onPreview={() => openPreview(file)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <FileCard key={file.id} file={file} onChange={fetchFiles} onPreview={() => openPreview(file)} listMode />
              ))}
            </div>
          )}

          <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
            <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
              {previewFile && <FileViewer file={previewFile} url={previewUrl} />}
            </DialogContent>
          </Dialog>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
