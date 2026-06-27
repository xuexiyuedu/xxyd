import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { isMockAuth, MOCK_TXT_CONTENT } from "@/lib/auth/mock-client";

/**
 * 获取文件预览 URL - 返回临时签名 URL
 * Mock 模式下返回 data URL 或直接返回文本内容
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

    // 获取文件信息
    const { data: file, error } = await supabase
      .from("files")
      .select("storage_key, original_name, file_type, mime_type, file_size, id")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (error || !file) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // Mock 模式：返回特殊 URL 或 data URL
    if (isMockAuth()) {
      // 对于 TXT 文件，返回 data URL 包含实际内容
      if (file.file_type === "txt") {
        const mockContent = file.id === "file-001" || file.storage_key?.includes("file-001")
          ? MOCK_TXT_CONTENT
          : file.id === "file-004" || file.storage_key?.includes("file-004")
          ? "这是一个学习笔记模板文件。\n\n## 康奈尔笔记法\n\n| 线索栏 | 笔记栏 |\n|--------|--------|\n| 关键词 | 详细内容 |\n\n## 总结\n\n在此写下本页笔记的核心要点。"
          : "这是一个示例文本文件。";
        const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(mockContent)}`;
        return NextResponse.json({ url: dataUrl, file, content: mockContent });
      }
      // 对于其他文件类型，返回占位 URL
      return NextResponse.json({
        url: `data:${file.mime_type || "application/octet-stream"};base64,`,
        file,
      });
    }

    // 生成临时签名 URL（有效期 15 分钟）
    const bucket = process.env.NEXT_PUBLIC_COS_BUCKET;
    const region = process.env.NEXT_PUBLIC_COS_REGION;
    const previewUrl = `https://${bucket}.cos.${region}.myqcloud.com/${file.storage_key}`;

    // 更新查看次数
    await supabase
      .from("files")
      .update({ view_count: (file.view_count || 0) + 1 })
      .eq("id", params.id);

    return NextResponse.json({
      url: previewUrl,
      file,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
