import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

/**
 * 获取书签列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    let query = supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (fileId) {
      query = query.eq("file_id", fileId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ bookmarks: data });
  } catch (error: any) {
    console.error("获取书签失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 添加书签
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { file_id, title, position } = await request.json();
    if (!file_id || !title || !position) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: session.user.id,
        file_id,
        title,
        position,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ bookmark: data });
  } catch (error: any) {
    console.error("添加书签失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 删除书签
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少书签ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("删除书签失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
