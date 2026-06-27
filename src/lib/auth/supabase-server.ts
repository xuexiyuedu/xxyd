import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
 * 服务端 Supabase 客户端（用于 Server Components 和 Route Handlers）
 * 若启用 NEXT_PUBLIC_MOCK_AUTH，则返回本地 Mock 客户端用于无后端开发
 */
export function createClient() {
  if (isMockAuth()) {
    return createMockClient();
  }

  const cookieStore = cookies();

  return createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 Server Component 中调用 set 会被忽略
          }
        },
      },
    }
  );
}

/**
 * 创建带 Service Role Key 的管理客户端（仅服务端，用于特权操作）
 */
export function createAdminClient() {
  if (isMockAuth()) {
    return createMockClient();
  }

  return createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
        setAll() {},
      },
    }
  );
}
