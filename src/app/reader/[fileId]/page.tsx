"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReaderContainer } from "@/components/reader/reader-container";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { FileItem } from "@/types/file";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.fileId as string;
  const [file, setFile] = useState<FileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFile() {
      try {
        const res = await fetch(`/api/files/${fileId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "加载失败");
        setFile(data.file);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (fileId) fetchFile();
  }, [fileId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载文档中...</div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "文件不存在"}</p>
        <Link href="/dashboard/files">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回资料管理
          </Button>
        </Link>
      </div>
    );
  }

  return <ReaderContainer file={file} />;
}
