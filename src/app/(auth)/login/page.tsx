"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/use-auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, signIn, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard/files");
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error);
    } else {
      toast.success("登录成功");
      router.push("/dashboard/files");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">知识阅读平台</span>
          </div>
          <CardTitle className="text-2xl">欢迎回来</CardTitle>
          <CardDescription>登录你的账号继续学习</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" placeholder="your@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full">登录</Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              忘记密码？
            </Link>
            <Link href="/register" className="text-primary hover:underline">
              没有账号？注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
