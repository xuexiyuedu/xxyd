"use client";

import { useState } from "react";
import { Loader2, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  url: string;
  name: string;
}

export function ImageViewer({ url, name }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground truncate max-w-[60%]">{name}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.25, s - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(4, s + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={url} download={name}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/50 p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <img
          src={url}
          alt={name}
          className="max-w-none transition-transform duration-200 shadow-lg"
          style={{ transform: `scale(${scale})` }}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
