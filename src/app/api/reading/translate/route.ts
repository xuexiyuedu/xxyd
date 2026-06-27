import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import crypto from "crypto";

/**
 * 翻译 API - 后端代理有道翻译
 * 避免前端直接调用暴露密钥和 CORS 问题
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { text, from = "auto", to = "zh" } = await request.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "缺少翻译文本" }, { status: 400 });
  }

  const appKey = process.env.YOUDAO_APP_KEY;
  const appSecret = process.env.YOUDAO_APP_SECRET;

  if (!appKey || !appSecret) {
    // 没有配置有道 API，返回模拟数据
    return NextResponse.json({
      translation: `[翻译服务未配置] ${text}`,
      phonetic: null,
      definition: null,
    });
  }

  try {
    const truncate = (q: string) => {
      const len = q.length;
      if (len <= 20) return q;
      return q.slice(0, 10) + len + q.slice(-10);
    };

    const salt = crypto.randomUUID();
    const curtime = Math.floor(Date.now() / 1000).toString();
    const signStr = appKey + truncate(text) + salt + curtime + appSecret;
    const sign = crypto.createHash("sha256").update(signStr).digest("hex");

    const params = new URLSearchParams({
      q: text,
      from,
      to,
      appKey,
      salt,
      sign,
      signType: "v3",
      curtime,
    });

    const res = await fetch("https://openapi.youdao.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();

    if (data.errorCode !== "0") {
      return NextResponse.json({ error: `翻译失败，错误码：${data.errorCode}` }, { status: 500 });
    }

    return NextResponse.json({
      translation: data.translation?.[0] || "",
      phonetic: data.basic?.phonetic || null,
      definition: data.basic?.explains?.join("; ") || null,
      examples: data.web?.slice(0, 3).map((w: any) => `${w.key}: ${w.value?.join(", ")}`) || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "翻译请求失败" }, { status: 500 });
  }
}
