"use client";

import { File, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "./image-viewer";
import { VideoPlayer } from "./video-player";
import { AudioPlayer } from "./audio-player";
import { CodeViewer, isCodeFile } from "./code-viewer";
import type { FileItem } from "@/types/file";

interface FileViewerProps {
  file: FileItem;
  url: string;
}

export function FileViewer({ file, url }: FileViewerProps) {
  const lowerName = file.original_name.toLowerCase();

  if (file.file_type === "image" || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lowerName)) {
    return <ImageViewer url={url} name={file.original_name} />;
  }

  if (file.file_type === "video" || /\.(mp4|webm|ogg|mov|mkv)$/i.test(lowerName)) {
    return <VideoPlayer url={url} name={file.original_name} />;
  }

  if (file.file_type === "audio" || /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(lowerName)) {
    return <AudioPlayer url={url} name={file.original_name} />;
  }

  if (file.file_type === "document" || isCodeFile(lowerName) || /\.(txt|md|json|csv|log)$/i.test(lowerName)) {
    return <CodeViewer url={url} name={file.original_name} />;
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-4 p-8 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium">{file.original_name}</p>
        <p className="text-sm text-muted-foreground mt-1">该文件类型暂不支持在线预览，请下载查看</p>
      </div>
      <Button asChild>
        <a href={url} download={file.original_name}>
          <Download className="h-4 w-4 mr-2" /> 下载文件
        </a>
      </Button>
    </div>
  );
}
