import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

/**
 * 生词本 CRUD API
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { data, error } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vocabulary: data });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();

  // 插入生词
  const { data: vocab, error: vocabError } = await supabase
    .from("vocabulary")
    .insert({ ...body, user_id: session.user.id })
    .select()
    .single();

  if (vocabError) return NextResponse.json({ error: vocabError.message }, { status: 500 });

  // 自动生成闪卡
  if (body.is_in_flashcards !== false) {
    await supabase.from("flashcards").insert({
      user_id: session.user.id,
      vocabulary_id: vocab.id,
      front_content: body.word,
      back_content: body.translation || body.definition || "",
    });
  }

  return NextResponse.json({ vocabulary: vocab });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  const { error } = await supabase
    .from("vocabulary")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
