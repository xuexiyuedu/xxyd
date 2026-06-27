import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { calculateSM2 } from "@/lib/reading/srs-sm2";
import type { ReviewGrade } from "@/types/reading";

/**
 * 闪卡 API - 获取待复习卡片 + 提交复习评分
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const mode = new URL(request.url).searchParams.get("mode") || "due";

  let query = supabase
    .from("flashcards")
    .select("*, vocabulary:vocabulary(*)")
    .eq("user_id", session.user.id);

  if (mode === "due") {
    query = query.lte("next_review_at", new Date().toISOString());
  }

  const { data, error } = await query.order("next_review_at", { ascending: true }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ flashcards: data });
}

/**
 * 提交复习评分 - 更新 SM-2 参数
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { flashcardId, grade } = await request.json();
  const reviewGrade = grade as ReviewGrade;

  // 获取当前闪卡状态
  const { data: card, error: fetchError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .eq("user_id", session.user.id)
    .single();

  if (fetchError || !card) {
    return NextResponse.json({ error: "闪卡不存在" }, { status: 404 });
  }

  // 计算 SM-2 结果
  const result = calculateSM2(
    reviewGrade,
    parseFloat(card.ease_factor),
    card.interval_days,
    card.repetition_count
  );

  // 更新闪卡
  const { data: updated, error: updateError } = await supabase
    .from("flashcards")
    .update({
      ease_factor: result.ease_factor,
      interval_days: result.interval_days,
      repetition_count: result.repetition_count,
      next_review_at: result.next_review_at,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", flashcardId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // 更新关联的生词掌握度
  if (card.vocabulary_id) {
    const proficiency = reviewGrade === 1 ? 0 : reviewGrade <= 2 ? 0 : reviewGrade === 3 ? 1 : 2;
    await supabase
      .from("vocabulary")
      .update({ proficiency })
      .eq("id", card.vocabulary_id);
  }

  return NextResponse.json({ flashcard: updated });
}
