import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

/**
 * 单文件操作 - 获取、更新、删除
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("files")
      .select("*, category:categories(*), tags:file_tags(tag:tags(*))")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ file: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { data, error } = await supabase
      .from("files")
      .update(body)
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ file: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取文件信息（用于后续删除 COS 文件）
    const { data: file } = await supabase
      .from("files")
      .select("storage_key, file_size")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (!file) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // 删除数据库记录
    const { error } = await supabase
      .from("files")
      .delete()
      .eq("id", params.id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    // 实际项目中还应删除 COS 上的文件
    // await cosClient.deleteObject({ Bucket, Key: file.storage_key });

    // 更新用户存储用量
    await supabase.rpc("decrement_storage_used", {
      user_id: session.user.id,
      size: file.file_size,
    }).then(() => {}, () => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
