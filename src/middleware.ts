import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createMockClient } from "@/lib/auth/mock-client";

function createSupabaseClient(request: NextRequest, response: NextResponse) {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
    return createMockClient();
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

/**
 * 路由守卫中间件 - 拦截未登录访问
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createSupabaseClient(request, response);
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // 公开路由：不需要登录
  // 注意：/share 必须对所有人公开（包括已登录用户），不能因登录而重定向
  const publicRoutes = ["/", "/login", "/register", "/forgot-password"];
  const shareRoute = "/share";
  const isPublicRoute = publicRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );
  const isShareRoute = pathname.startsWith(shareRoute);

  // API 路由不需要中间件保护（API 内部自行验证）
  if (pathname.startsWith("/api/")) {
    return response;
  }

  // 分享页面：对所有人公开，不因登录状态重定向
  if (isShareRoute) {
    return response;
  }

  // 已登录用户访问认证页面 → 重定向到 dashboard
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard/files", request.url));
  }

  // 未登录用户访问受保护页面 → 重定向到登录页
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|manifest)$).*)"],
};
