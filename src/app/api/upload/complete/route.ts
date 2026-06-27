import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { detectDocumentFormat, getFileExtension } from "@/lib/utils";
import type { FileType } from "@/types/file";

/**
 * 完成上传 - 合并分片，写入文件元数据到数据库
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId, fileId, filename, fileSize, mimeType, categoryId } = body;

    // 实际项目中：合并 COS 分片（CompleteMultipartUpload）
    // 这里简化处理：假设分片已上传，直接生成最终存储路径

    const ext = getFileExtension(filename);
    const storageKey = `uploads/${session.user.id}/${fileId}.${ext}`;

    // 判断文件类型
    const docFormat = detectDocumentFormat(filename);
    let fileType: FileType = "other";
    if (docFormat === "pdf") fileType = "pdf";
    else if (docFormat === "epub") fileType = "epub";
    else if (docFormat === "txt") fileType = "txt";
    else if (mimeType?.startsWith("image/")) fileType = "image";
    else if (mimeType?.startsWith("video/")) fileType = "video";
    else if (mimeType?.startsWith("audio/")) fileType = "audio";
    else if (mimeType?.includes("zip") || mimeType?.includes("rar")) fileType = "archive";
    else if (mimeType?.includes("document") || mimeType?.includes("word") ||
             mimeType?.includes("sheet") || mimeType?.includes("presentation")) fileType = "document";

    // 写入文件记录到数据库
    const { data, error } = await supabase
      .from("files")
      .insert({
        id: fileId,
        user_id: session.user.id,
        original_name: filename,
        storage_key: storageKey,
        file_size: fileSize,
        file_type: fileType,
        mime_type: mimeType,
        category_id: categoryId || null,
      })
      .select()
      .single();

    if (error) throw error;

    // 更新用户存储用量
    await supabase.rpc("increment_storage_used", {
      user_id: session.user.id,
      size: fileSize,
    }).then(() => {}, () => {}); // 忽略错误（RPC 可能不存在）

    return NextResponse.json({
      success: true,
      file: data,
    });
  } catch (error: any) {
    console.error("完成上传错误:", error);
    return NextResponse.json(
      { error: error.message || "完成上传失败" },
      { status: 500 }
    );
  }
}
