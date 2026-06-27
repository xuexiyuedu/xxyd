import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import {
  generateShareToken,
  hashPassword,
} from "@/lib/share/permission";

/**
 * 创建分享链接
 * POST /api/share/create
 * body: {
 *   file_id: string;
 *   password?: string;       // 可选密码
 *   expires_in_days?: number; // 可选有效期天数，null/0 表示永久
 *   download_limit?: number;  // 可选下载次数限制
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { file_id, password, expires_in_days, download_limit } = body;

    if (!file_id) {
      return NextResponse.json({ error: "缺少 file_id" }, { status: 400 });
    }

    // 校验文件归属
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, user_id, original_name")
      .eq("id", file_id)
      .eq("user_id", session.user.id)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: "文件不存在或无权分享" }, { status: 404 });
    }

    const token = generateShareToken();
    const passwordHash = await hashPassword(password || null);

    const expires_at =
      expires_in_days && expires_in_days > 0
        ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
        : null;

    const { data: share, error } = await supabase
      .from("share_links")
      .insert({
        file_id,
        user_id: session.user.id,
        token,
        password: passwordHash,
        expires_at,
        download_limit: download_limit && download_limit > 0 ? download_limit : null,
        download_count: 0,
        view_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // 同步更新文件的 share_token（便于文件列表显示分享状态）
    await supabase
      .from("files")
      .update({ share_token: token })
      .eq("id", file_id)
      .eq("user_id", session.user.id)
      .then(() => {}, () => {});

    return NextResponse.json({ share });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
