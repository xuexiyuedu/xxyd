"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/auth/supabase-browser";
import type { DocumentFormat, ReadingPosition } from "@/types/reading";

interface UseReadingTrackerProps {
  fileId: string;
  docFormat: DocumentFormat;
}

interface UseReadingTrackerReturn {
  readingTime: number; // 当前会话阅读秒数
  startTracking: () => void;
  stopTracking: () => void;
  saveProgress: (position?: ReadingPosition, progress?: number) => Promise<void>;
}

/**
 * 阅读追踪 Hook
 * - 使用 Page Visibility API 确保用户真正在看时才计时
 * - 每 30 秒自动保存进度到数据库
 * - 退出时自动保存
 */
export function useReadingTracker({ fileId, docFormat }: UseReadingTrackerProps): UseReadingTrackerReturn {
  const [readingTime, setReadingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  // 开始追踪
  const startTracking = useCallback(async () => {
    startTimeRef.current = new Date();

    // 创建阅读会话记录
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("reading_sessions")
        .insert({
          user_id: user.id,
          file_id: fileId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      sessionIdRef.current = data?.id || null;
    }

    // 每秒更新计时
    timerRef.current = setInterval(() => {
      if (isVisibleRef.current && document.visibilityState === "visible") {
        setReadingTime((prev) => prev + 1);
      }
    }, 1000);

    // 监听进度更新事件
    const handleProgressUpdate = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.position || detail?.progress !== undefined) {
        await saveProgress(detail.position, detail.progress);
      }
    };
    window.addEventListener("reader-progress-update", handleProgressUpdate);

    // 每 30 秒自动保存
    const autoSaveTimer = setInterval(() => {
      saveProgress();
    }, 30000);

    // 页面可见性变化
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 清理函数存储
    (startTracking as any).cleanup = () => {
      window.removeEventListener("reader-progress-update", handleProgressUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(autoSaveTimer);
    };
  }, [fileId]);

  // 保存进度
  const saveProgress = useCallback(async (position?: ReadingPosition, progress?: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updateData: any = {
      last_read_at: new Date().toISOString(),
      total_reading_time: readingTime + (readingTime > 0 ? 0 : 0), // 累计时间
    };

    if (position) {
      updateData.current_position = position;
    }
    if (progress !== undefined) {
      updateData.total_progress = progress;
      if (progress >= 95) updateData.is_finished = true;
    }

    // upsert 进度记录
    await supabase
      .from("reading_progress")
      .upsert({
        user_id: user.id,
        file_id: fileId,
        document_format: docFormat,
        ...updateData,
      }, { onConflict: "user_id,file_id" });

    // 更新会话时长
    if (sessionIdRef.current) {
      await supabase
        .from("reading_sessions")
        .update({
          duration_seconds: readingTime,
        })
        .eq("id", sessionIdRef.current);
    }
  }, [fileId, docFormat, readingTime]);

  // 停止追踪
  const stopTracking = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 最终保存
    saveProgress();

    // 更新会话结束时间
    if (sessionIdRef.current) {
      const supabase = createClient();
      supabase
        .from("reading_sessions")
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: readingTime,
        })
        .eq("id", sessionIdRef.current)
        .then(() => {});
    }

    // 清理事件监听
    const cleanup = (startTracking as any).cleanup;
    if (cleanup) cleanup();

    // 页面卸载时保存
    const handleBeforeUnload = () => saveProgress();
    window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveProgress, readingTime, startTracking]);

  // 页面卸载时保存
  useEffect(() => {
    const handleBeforeUnload = () => saveProgress();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [saveProgress]);

  return { readingTime, startTracking, stopTracking, saveProgress };
}
