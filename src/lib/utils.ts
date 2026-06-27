import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 格式化日期时间
 */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "未知";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "未知";
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return "未知时间";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "未知时间";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return formatDate(d);
}

/**
 * 格式化阅读时长（秒转可读格式）
 */
export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}小时${remainingMinutes}分钟`;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * 根据文件扩展名判断文档格式
 */
export function detectDocumentFormat(filename: string): "pdf" | "epub" | "txt" | "markdown" | null {
  const ext = getFileExtension(filename);
  if (ext === "pdf") return "pdf";
  if (ext === "epub") return "epub";
  if (ext === "txt") return "txt";
  if (ext === "md" || ext === "markdown") return "markdown";
  return null;
}

/**
 * 根据MIME类型获取文件图标名
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word")) return "word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "excel";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "ppt";
  if (mimeType === "application/epub+zip") return "epub";
  if (mimeType.startsWith("text/")) return "text";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return "archive";
  return "file";
}

/**
 * 生成随机ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
