"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TimerMode = "work" | "break";

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [minutes, setMinutes] = useState(DEFAULT_WORK_MINUTES);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const totalSeconds = mode === "work" ? DEFAULT_WORK_MINUTES * 60 : DEFAULT_BREAK_MINUTES * 60;
  const remainingSeconds = minutes * 60 + seconds;
  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  const tick = useCallback(() => {
    setSeconds((prev) => {
      if (prev === 0) {
        setMinutes((m) => {
          if (m === 0) {
            // 计时结束，切换模式
            const nextMode = mode === "work" ? "break" : "work";
            setMode(nextMode);
            setIsRunning(false);
            return nextMode === "work" ? DEFAULT_WORK_MINUTES : DEFAULT_BREAK_MINUTES;
          }
          return m - 1;
        });
        return 59;
      }
      return prev - 1;
    });
  }, [mode]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const reset = () => {
    setIsRunning(false);
    setMode("work");
    setMinutes(DEFAULT_WORK_MINUTES);
    setSeconds(0);
  };

  const toggleMode = () => {
    const next = mode === "work" ? "break" : "work";
    setMode(next);
    setMinutes(next === "work" ? DEFAULT_WORK_MINUTES : DEFAULT_BREAK_MINUTES);
    setSeconds(0);
    setIsRunning(false);
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {mode === "work" ? <Brain className="h-4 w-4 text-primary" /> : <Coffee className="h-4 w-4 text-orange-500" />}
          <span className="text-sm font-medium">{mode === "work" ? "专注阅读" : "休息一下"}</span>
        </div>
        <button onClick={toggleMode} className="text-xs text-muted-foreground hover:text-foreground">
          切换模式
        </button>
      </div>

      <div className="relative flex items-center justify-center py-4">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className={cn("transition-all", mode === "work" ? "text-primary" : "text-orange-500")}
            strokeDasharray={`${progress * 2.83} 283`}
          />
        </svg>
        <div className="absolute text-2xl font-bold tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button size="sm" onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {isRunning ? "暂停" : "开始"}
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-1" /> 重置
        </Button>
      </div>
    </div>
  );
}
