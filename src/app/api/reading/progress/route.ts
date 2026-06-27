import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

/**
 * 阅读进度 API
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const fileId = new URL(request.url).searchParams.get("fileId");

  if (fileId) {
    // 获取单文件进度
    const { data, error } = await supabase
      .from("reading_progress")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("file_id", fileId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress: data });
  }

  // 获取所有进度
  const { data, error } = await supabase
    .from("reading_progress")
    .select("*, file:files(original_name)")
    .eq("user_id", session.user.id)
    .order("last_read_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}

/**
 * 保存/更新阅读进度
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("reading_progress")
    .upsert({
      user_id: session.user.id,
      file_id: body.file_id,
      document_format: body.document_format,
      current_position: body.current_position,
      total_progress: body.total_progress,
      total_reading_time: body.total_reading_time,
      last_read_at: new Date().toISOString(),
      is_finished: body.is_finished || body.total_progress >= 95,
    }, { onConflict: "user_id,file_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data });
}
