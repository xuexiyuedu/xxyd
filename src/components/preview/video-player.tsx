"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  url: string;
  name: string;
}

export function VideoPlayer({ url, name }: VideoPlayerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground truncate max-w-[80%]">{name}</span>
        <Button variant="ghost" size="icon" asChild>
          <a href={url} download={name}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <video
          src={url}
          controls
          className="max-h-full max-w-full"
          controlsList="nodownload"
        >
          你的浏览器不支持视频播放。
        </video>
      </div>
    </div>
  );
}
