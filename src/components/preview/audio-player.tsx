"use client";

import { Music, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  url: string;
  name: string;
}

export function AudioPlayer({ url, name }: AudioPlayerProps) {
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
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Music className="h-12 w-12 text-primary" />
        </div>
        <audio src={url} controls className="w-full max-w-md">
          你的浏览器不支持音频播放。
        </audio>
      </div>
    </div>
  );
}
