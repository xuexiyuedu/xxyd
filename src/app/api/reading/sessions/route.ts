import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

/**
 * 阅读会话 API - 创建/更新阅读会话记录
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("reading_sessions")
    .insert({
      user_id: session.user.id,
      file_id: body.file_id,
      started_at: body.started_at || new Date().toISOString(),
      ended_at: body.ended_at,
      duration_seconds: body.duration_seconds || 0,
      pages_read: body.pages_read || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabase
    .from("reading_sessions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
