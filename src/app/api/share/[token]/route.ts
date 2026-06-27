import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import {
  checkShareAccess,
  isExpired,
  isDownloadLimited,
  verifyPassword,
} from "@/lib/share/permission";

/**
 * 访客访问分享链接
 *
 * GET    /api/share/[token]                  — 获取分享元信息（不含文件URL）
 * POST   /api/share/[token]                  — 提交密码验证 / 记录访问
 * body: { action: "verify_password" | "record_view" | "record_download", password?: string }
 */

/**
 * 获取分享信息（公开元数据，文件 URL 需通过密码验证后获取）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient();

    const { data: share, error } = await supabase
      .from("share_links")
      .select(
        "id, file_id, user_id, token, password, expires_at, download_limit, download_count, view_count, is_active, created_at, file:files(id, original_name, file_type, file_size, mime_type)"
      )
      .eq("token", params.token)
      .single();

    if (error || !share) {
      return NextResponse.json(
        { ok: false, reason: "not_found" },
        { status: 404 }
      );
    }

    const result = checkShareAccess(share as any);
    if (!result.ok) {
      return NextResponse.json(result, { status: 403 });
    }

    // 不返回密码 hash 给前端
    const { password, ...safeShare } = share as any;

    return NextResponse.json({
      ok: true,
      share: {
        ...safeShare,
        has_password: !!password,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 密码验证 / 记录访问 / 记录下载
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient();

    const { data: share, error } = await supabase
      .from("share_links")
      .select(
        "id, file_id, user_id, token, password, expires_at, download_limit, download_count, view_count, is_active, created_at, file:files(id, original_name, file_type, file_size, mime_type, storage_key)"
      )
      .eq("token", params.token)
      .single();

    if (error || !share) {
      return NextResponse.json(
        { ok: false, reason: "not_found" },
        { status: 404 }
      );
    }

    const result = checkShareAccess(share as any);
    if (!result.ok) {
      return NextResponse.json(result, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action as string | undefined;

    // 验证密码
    if (action === "verify_password") {
      const passwordOk = await verifyPassword(body.password || "", share.password);
      if (!passwordOk) {
        return NextResponse.json(
          { ok: false, reason: "password_wrong" },
          { status: 403 }
        );
      }

      // 记录一次访问
      await supabase
        .from("share_links")
        .update({ view_count: (share.view_count || 0) + 1 })
        .eq("id", share.id)
        .then(() => {}, () => {});

      const { password: _pwd, ...safeShare } = share as any;
      return NextResponse.json({
        ok: true,
        share: {
          ...safeShare,
          has_password: true,
          password_verified: true,
        },
      });
    }

    // 仅记录访问（无需密码时调用）
    if (action === "record_view") {
      await supabase
        .from("share_links")
        .update({ view_count: (share.view_count || 0) + 1 })
        .eq("id", share.id)
        .then(() => {}, () => {});

      return NextResponse.json({ ok: true });
    }

    // 记录下载并校验次数
    if (action === "record_download") {
      if (isDownloadLimited(share)) {
        return NextResponse.json(
          { ok: false, reason: "limit_exceeded" },
          { status: 403 }
        );
      }
      await supabase
        .from("share_links")
        .update({ download_count: (share.download_count || 0) + 1 })
        .eq("id", share.id)
        .then(() => {}, () => {});
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, reason: "unknown_action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
