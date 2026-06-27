import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";

/**
 * 分享管理 API
 *
 * GET    /api/share/manage              — 获取当前用户所有分享列表
 * PATCH  /api/share/manage?id=xxx       — 更新分享（启用/禁用、重置密码、续期）
 * DELETE /api/share/manage?id=xxx       — 删除分享
 */

/**
 * 获取当前用户的分享列表
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("share_links")
      .select(
        "id, file_id, token, password, expires_at, download_limit, download_count, view_count, is_active, created_at, updated_at, file:files(id, original_name, file_type, file_size, mime_type)"
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ shares: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 更新分享（启用/禁用、续期、重置密码/下载次数）
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少分享 id" }, { status: 400 });
    }

    const body = await request.json();
    const update: Record<string, any> = {};

    if (typeof body.is_active === "boolean") update.is_active = body.is_active;
    if (body.expires_at !== undefined) {
      update.expires_at = body.expires_at;
    }
    if (body.expires_in_days !== undefined) {
      update.expires_at =
        body.expires_in_days > 0
          ? new Date(Date.now() + body.expires_in_days * 86400000).toISOString()
          : null;
    }
    if (typeof body.download_limit === "number") {
      update.download_limit = body.download_limit > 0 ? body.download_limit : null;
    }
    if (typeof body.reset_download_count === "boolean" && body.reset_download_count) {
      update.download_count = 0;
    }

    const { data, error } = await supabase
      .from("share_links")
      .update(update)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ share: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 删除分享
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "缺少分享 id" }, { status: 400 });
    }

    // 先拿到 token 以便清空文件 share_token
    const { data: share } = await supabase
      .from("share_links")
      .select("file_id, token")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    const { error } = await supabase
      .from("share_links")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    // 清空对应文件的 share_token
    if (share?.file_id) {
      await supabase
        .from("files")
        .update({ share_token: null })
        .eq("id", share.file_id)
        .eq("user_id", session.user.id)
        .then(() => {}, () => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
