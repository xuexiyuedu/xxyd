"use client";

import { useState, useEffect } from "react";

// 动态导入 pdfjs-dist（避免 SSR 问题）
export let pdfjsLib: any = null;

export function usePdfDocument(fileId: string) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocument() {
      try {
        setIsLoading(true);

        // 动态加载 pdfjs-dist
        if (!pdfjsLib) {
          pdfjsLib = await import("pdfjs-dist");
          // 设置 worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs`;
        }

        // 获取文件预览 URL
        const res = await fetch(`/api/files/${fileId}/preview`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "获取文件失败");

        // 加载 PDF
        const loadingTask = pdfjsLib.getDocument({ url: data.url });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
      } catch (err: any) {
        setError(err.message || "加载 PDF 失败");
      } finally {
        setIsLoading(false);
      }
    }

    if (fileId) loadDocument();
  }, [fileId]);

  return { pdfDoc, isLoading, error };
}
