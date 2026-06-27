import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { nanoid } from "nanoid";

/**
 * 初始化上传 - 创建上传任务记录，返回 uploadId
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { filename, fileSize, mimeType, totalChunks, categoryId } = body;

    // 生成上传ID
    const uploadId = nanoid();
    const fileId = nanoid();

    // 生成存储路径
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const storageKey = `uploads/${session.user.id}/${fileId}.${ext}`;

    // 创建临时上传记录（可存入 Redis 或数据库临时表，这里用内存模拟）
    // 实际项目中应使用 Redis 或数据库临时表

    return NextResponse.json({
      uploadId,
      fileId,
      storageKey,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "初始化上传失败" },
      { status: 500 }
    );
  }
}
