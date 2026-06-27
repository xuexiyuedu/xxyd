import { NextResponse } from "next/server";

/**
 * 健康检查端点
 * GET /api/health
 *
 * 用于部署平台（Vercel / CloudBase / Docker HEALTHCHECK）探活
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "knowledge-reader",
    version: "1.0.0",
    mock_mode: process.env.NEXT_PUBLIC_MOCK_AUTH === "true",
  });
}
