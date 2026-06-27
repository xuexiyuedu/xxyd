import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

/**
 * 阅读统计 API
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "week"; // today, week, month, all

  const now = new Date();
  let startDate = new Date();
  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "all":
      startDate = new Date(0);
      break;
  }

  // 阅读会话统计
  const { data: sessionsRaw } = await supabase
    .from("reading_sessions")
    .select("duration_seconds, started_at, pages_read")
    .eq("user_id", session.user.id)
    .gte("started_at", startDate.toISOString());

  const sessions = (sessionsRaw ?? []) as { duration_seconds?: number; pages_read?: number; started_at: string }[];

  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  const totalPages = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);

  // 每日阅读数据
  const dailyMap = new Map<string, number>();
  sessions.forEach((s) => {
    const date = new Date(s.started_at).toLocaleDateString("zh-CN");
    dailyMap.set(date, (dailyMap.get(date) || 0) + (s.duration_seconds || 0));
  });

  // 完成书籍数
  const { count: finishedCount } = await supabase
    .from("reading_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("is_finished", true);

  // 总书籍数
  const { count: totalCount } = await supabase
    .from("reading_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  // 待复习闪卡数
  const { count: dueFlashcards } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .lte("next_review_at", new Date().toISOString());

  return NextResponse.json({
    totalDuration,
    totalPages,
    totalSessions: sessions?.length || 0,
    finishedBooks: finishedCount || 0,
    totalBooks: totalCount || 0,
    dueFlashcards: dueFlashcards || 0,
    dailyData: Array.from(dailyMap.entries()).map(([date, seconds]) => ({
      date,
      minutes: Math.round(seconds / 60),
    })),
  });
}
