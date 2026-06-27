"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Target, Flame, TrendingUp, Brain } from "lucide-react";
import { formatReadingTime, cn } from "@/lib/utils";
import { FlashcardReview } from "@/components/reading/vocabulary/flashcard-review";
import { PomodoroTimer } from "@/components/reading/focus/pomodoro-timer";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { createClient } from "@/lib/auth/supabase-browser";
import Link from "next/link";
import type { ReadingStats as ReadingStatsType } from "@/types/reading";

export default function StatsPage() {
  const [stats, setStats] = useState<ReadingStatsType | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "flashcards">("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 今日阅读时长
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todaySessions } = await supabase
        .from("reading_sessions")
        .select("duration_seconds")
        .eq("user_id", user.id)
        .gte("started_at", todayStart.toISOString());

      const todayTime = todaySessions?.reduce((sum: number, s: { duration_seconds?: number }) => sum + (s.duration_seconds || 0), 0) || 0;

      // 本周阅读时长
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const { data: weekSessions } = await supabase
        .from("reading_sessions")
        .select("duration_seconds")
        .eq("user_id", user.id)
        .gte("started_at", weekStart.toISOString());

      const weekTime = weekSessions?.reduce((sum: number, s: { duration_seconds?: number }) => sum + (s.duration_seconds || 0), 0) || 0;

      // 本月阅读时长
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - 1);
      const { data: monthSessions } = await supabase
        .from("reading_sessions")
        .select("duration_seconds")
        .eq("user_id", user.id)
        .gte("started_at", monthStart.toISOString());

      const monthTime = monthSessions?.reduce((sum: number, s: { duration_seconds?: number }) => sum + (s.duration_seconds || 0), 0) || 0;

      // 完成书籍数
      const { count: finishedCount } = await supabase
        .from("reading_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_finished", true);

      // 总书籍数
      const { count: totalCount } = await supabase
        .from("reading_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // 每日阅读数据（最近7天）
      const dailyData: { date: string; minutes: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { data: daySessions } = await supabase
          .from("reading_sessions")
          .select("duration_seconds")
          .eq("user_id", user.id)
          .gte("started_at", date.toISOString())
          .lt("started_at", nextDate.toISOString());

        const dayTime = daySessions?.reduce((sum: number, s: { duration_seconds?: number }) => sum + (s.duration_seconds || 0), 0) || 0;
        dailyData.push({
          date: date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
          minutes: Math.round(dayTime / 60),
        });
      }

      // 最近阅读
      const { data: recent } = await supabase
        .from("reading_progress")
        .select("file_id, total_progress, last_read_at, total_reading_time, file:files(original_name)")
        .eq("user_id", user.id)
        .order("last_read_at", { ascending: false })
        .limit(5);

      // 阅读设置（目标）
      const { data: settings } = await supabase
        .from("reading_settings")
        .select("reading_goal_minutes")
        .eq("user_id", user.id)
        .single();

      const goalMinutes = settings?.reading_goal_minutes || 30;

      setStats({
        todayReadingTime: todayTime,
        weekReadingTime: weekTime,
        monthReadingTime: monthTime,
        totalReadingTime: monthTime, // 简化
        finishedBooks: finishedCount || 0,
        totalBooks: totalCount || 0,
        currentStreak: 1, // 简化
        dailyData,
        recentReading: (recent || []).map((r: any) => ({
          file_id: r.file_id,
          file_name: r.file?.original_name || "未知",
          progress: r.total_progress,
          last_read_at: r.last_read_at,
          reading_time: r.total_reading_time,
        })),
      });

      setIsLoading(false);
    }

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">加载统计数据...</div>
      </div>
    );
  }

  const goalProgress = stats ? (stats.todayReadingTime / 60 / 30) * 100 : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">阅读统计</h1>
        <div className="flex gap-1">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("overview")}
          >
            概览
          </Button>
          <Button
            variant={activeTab === "flashcards" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("flashcards")}
          >
            <Brain className="h-3 w-3 mr-1" /> 闪卡复习
          </Button>
        </div>
      </div>

      {activeTab === "flashcards" ? (
        <FlashcardReview />
      ) : (
        <>
          {/* 数据卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">今日阅读</span>
              </div>
              <p className="text-2xl font-bold">{formatReadingTime(stats?.todayReadingTime || 0)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">本周阅读</span>
              </div>
              <p className="text-2xl font-bold">{formatReadingTime(stats?.weekReadingTime || 0)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">已读书籍</span>
              </div>
              <p className="text-2xl font-bold">{stats?.finishedBooks || 0}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">连续阅读</span>
              </div>
              <p className="text-2xl font-bold">{stats?.currentStreak || 0} 天</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 阅读目标 */}
            <Card className="p-4 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">今日阅读目标</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {Math.round((stats?.todayReadingTime || 0) / 60)} / 30 分钟
                </span>
              </div>
              <Progress value={Math.min(goalProgress, 100)} />
            </Card>

            {/* 番茄钟 */}
            <PomodoroTimer />
          </div>

          {/* 每日阅读趋势图 */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">最近7天阅读时长</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="分" />
                <Tooltip
                  formatter={(value: any) => [`${value} 分钟`, "阅读时长"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* 最近阅读 */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">最近阅读</h3>
            <div className="space-y-2">
              {stats?.recentReading?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">暂无阅读记录</p>
              ) : (
                stats?.recentReading?.map((item, i) => (
                  <Link
                    key={i}
                    href={`/reader/${item.file_id}`}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file_name}</p>
                      <div className="flex items-center gap-3">
                        <Progress value={item.progress} className="h-1 w-20" />
                        <span className="text-xs text-muted-foreground">{item.progress}%</span>
                        <span className="text-xs text-muted-foreground">
                          {formatReadingTime(item.reading_time)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
