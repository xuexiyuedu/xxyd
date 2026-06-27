"use client";

import { useState, useEffect } from "react";
import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CodeViewerProps {
  url: string;
  name: string;
}

const codeExtensions = new Set([
  "js", "ts", "tsx", "jsx", "json", "html", "css", "scss", "py", "java", "c", "cpp", "h", "go", "rs", "rb", "php", "sql", "md", "yaml", "yml", "xml", "sh", "bash"
]);

export function isCodeFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return codeExtensions.has(ext);
}

export function CodeViewer({ url, name }: CodeViewerProps) {
  const [content, setContent] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then(setContent)
      .catch(() => setContent("无法加载文件内容"));
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <span className="text-sm text-muted-foreground truncate max-w-[60%]">{name}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={url} download={name}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <pre className="text-sm font-mono whitespace-pre-wrap break-all">{content}</pre>
      </div>
    </div>
  );
}
