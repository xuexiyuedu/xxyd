"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

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
