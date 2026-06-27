import { createBrowserClient } from "@supabase/ssr";
import { createMockClient, isMockAuth } from "./mock-client";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "" || value.includes("your_")) {
    throw new Error(
      `缺少环境变量 ${name}。请先在 .env.local 中填入 Supabase 项目对应的真实值，然后重启开发服务器。`
    );
  }
  return value;
}

/**
 * 浏览器端 Supabase 客户端
 * 若启用 NEXT_PUBLIC_MOCK_AUTH，则返回本地 Mock 客户端用于无后端开发
 */
export function createClient() {
  if (isMockAuth()) {
    return createMockClient();
  }

  return createBrowserClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}
