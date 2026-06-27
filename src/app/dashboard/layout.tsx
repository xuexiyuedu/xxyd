"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/use-auth-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BookOpen, FolderOpen, StickyNote, BarChart3, LogOut, User as UserIcon, Settings, BookMarked, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/files", label: "资料管理", icon: FolderOpen },
  { href: "/dashboard/notes", label: "笔记中心", icon: StickyNote },
  { href: "/dashboard/vocabulary", label: "生词本", icon: BookMarked },
  { href: "/dashboard/shares", label: "分享管理", icon: Link2 },
  { href: "/dashboard/stats", label: "阅读统计", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, initialize, signOut } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.username || user.email?.split("@")[0] || "用户";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* 侧边栏 */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">知识阅读</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push("/dashboard/files")}>
                <UserIcon className="mr-2 h-4 w-4" /> 个人中心
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" /> 设置
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" /> 退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 移动端顶栏 */}
        <header className="md:hidden flex h-14 items-center justify-between border-b px-4 bg-background">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold">知识阅读</span>
          </div>
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </nav>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
