"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 用实际网络请求检测，而非依赖不可靠的 navigator.onLine
    const checkOnline = async () => {
      try {
        const res = await fetch("/api/health", { 
          method: "HEAD",
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        setIsOffline(!res.ok);
      } catch {
        // fetch 失败再检查 navigator.onLine 作为 fallback
        setIsOffline(!navigator.onLine);
      }
      setChecked(true);
    };

    // 初始检测
    checkOnline();

    // 监听系统事件（作为辅助）
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => checkOnline();
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // 未完成初始检测时，不显示离线提示（避免误报）
  if (!checked) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-destructive px-3 py-1.5 text-xs text-destructive-foreground shadow-lg transition-transform",
        isOffline ? "translate-y-0" : "translate-y-20"
      )}
    >
      <WifiOff className="h-3.5 w-3.5" />
      当前处于离线模式
    </div>
  );
}
