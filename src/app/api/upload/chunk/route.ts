import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { isMockAuth } from "@/lib/auth/mock-client";

// 腾讯云 COS 配置（兼容 S3 协议）- 仅在非 Mock 模式下创建
let s3Client: any = null;
function getS3Client() {
  if (!s3Client && !isMockAuth()) {
    const { S3Client } = require("@aws-sdk/client-s3");
    s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_COS_REGION || "ap-guangzhou",
      endpoint: `https://cos.${process.env.NEXT_PUBLIC_COS_REGION || "ap-guangzhou"}.myqcloud.com`,
      credentials: {
        accessKeyId: process.env.COS_SECRET_ID!,
        secretAccessKey: process.env.COS_SECRET_KEY!,
      },
    });
  }
  return s3Client;
}

/**
 * 上传分片 - 接收文件分片并存储到 COS
 * Mock 模式下跳过实际存储，直接返回成功
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const uploadId = formData.get("uploadId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);

    if (!chunk || !uploadId) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    // Mock 模式：跳过 COS 上传，直接返回成功
    if (isMockAuth()) {
      return NextResponse.json({
        success: true,
        chunkIndex,
        totalChunks,
      });
    }

    // 实际上传到 COS
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    const client = getS3Client();
    const chunkBuffer = await chunk.arrayBuffer();
    const chunkKey = `tmp/${uploadId}/chunk-${chunkIndex}`;

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_COS_BUCKET!,
        Key: chunkKey,
        Body: new Uint8Array(chunkBuffer),
      })
    );

    return NextResponse.json({
      success: true,
      chunkIndex,
      totalChunks,
    });
  } catch (error: any) {
    console.error("分片上传错误:", error);
    return NextResponse.json(
      { error: error.message || "分片上传失败" },
      { status: 500 }
    );
  }
}
