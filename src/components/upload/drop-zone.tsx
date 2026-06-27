"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X, File as FileIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { cn, formatFileSize, detectDocumentFormat } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { UploadTask } from "@/types/file";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CONCURRENT = 3;
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/epub+zip",
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "application/zip",
  "application/x-rar-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export function DropZone({
  onUploadComplete,
  categoryId,
}: {
  onUploadComplete?: () => void;
  categoryId?: string;
}) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `文件 ${file.name} 超过最大限制 ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    // 允许所有类型，只做大小限制
    return null;
  }, []);

  const uploadFile = useCallback(
    async (task: UploadTask) => {
      const { file } = task;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 更新状态为上传中
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "uploading", totalChunks } : t
        )
      );

      try {
        // 1. 初始化上传
        const initRes = await fetch("/api/upload/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            totalChunks,
            categoryId,
          }),
        });

        if (!initRes.ok) throw new Error("初始化上传失败");
        const { uploadId, fileId } = await initRes.json();

        // 2. 分片上传
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append("chunk", chunk);
          formData.append("uploadId", uploadId);
          formData.append("chunkIndex", String(i));
          formData.append("totalChunks", String(totalChunks));

          const controller = new AbortController();
          abortControllers.current.set(task.id, controller);

          const res = await fetch("/api/upload/chunk", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });

          if (!res.ok) throw new Error(`分片 ${i + 1}/${totalChunks} 上传失败`);

          // 更新进度
          const progress = ((i + 1) / totalChunks) * 100;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, progress, uploadedChunks: i + 1 }
                : t
            )
          );
        }

        // 3. 完成上传
        const completeRes = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId,
            fileId,
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            categoryId,
          }),
        });

        if (!completeRes.ok) throw new Error("完成上传失败");

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: "completed", progress: 100 } : t
          )
        );
        toast.success(`${file.name} 上传成功`);
        onUploadComplete?.();
      } catch (err: any) {
        if (err.name === "AbortError") {
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: "paused" } : t))
          );
        } else {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, status: "error", error: err.message } : t
            )
          );
          toast.error(`${file.name} 上传失败: ${err.message}`);
        }
      }
    },
    [categoryId, onUploadComplete]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      const validFiles: UploadTask[] = [];
      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          toast.error(error);
          return;
        }
        validFiles.push({
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          file,
          progress: 0,
          status: "pending",
        });
      });

      if (validFiles.length === 0) return;

      setTasks((prev) => [...prev, ...validFiles]);

      // 并发上传（最多 MAX_CONCURRENT 个）
      validFiles.forEach((task, index) => {
        setTimeout(() => uploadFile(task), index * 300);
      });
    },
    [uploadFile, validateFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleCancel = (taskId: string) => {
    const controller = abortControllers.current.get(taskId);
    controller?.abort();
    abortControllers.current.delete(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== "completed"));
  };

  return (
    <div className="space-y-4">
      {/* 拖拽区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5 dropzone-active"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">点击或拖拽文件到此处上传</p>
        <p className="text-xs text-muted-foreground mt-1">
          支持 PDF、EPUB、TXT、图片、视频等格式，单文件最大 {formatFileSize(MAX_FILE_SIZE)}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* 上传队列 */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">上传队列 ({tasks.length})</h4>
            <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
              清除已完成
            </Button>
          </div>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <div className="flex-shrink-0">
                {task.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : task.status === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{task.file.name}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatFileSize(task.file.size)}
                  </span>
                </div>
                {task.status === "uploading" || task.status === "completed" ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={task.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(task.progress)}%
                    </span>
                  </div>
                ) : task.status === "error" ? (
                  <p className="mt-1 text-xs text-red-500">{task.error}</p>
                ) : task.status === "paused" ? (
                  <p className="mt-1 text-xs text-muted-foreground">已暂停</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">等待中...</p>
                )}
              </div>
              {task.status !== "completed" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => handleCancel(task.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
