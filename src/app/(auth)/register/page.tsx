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

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading, signUp, initialize } = useAuthStore();

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
    const confirmPassword = formData.get("confirmPassword") as string;
    const username = formData.get("username") as string;

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      toast.error("密码至少 6 位");
      return;
    }
    if (username.length < 2) {
      toast.error("用户名至少 2 个字符");
      return;
    }

    const { error } = await signUp(email, password, username);
    if (error) {
      toast.error(error);
    } else {
      toast.success("注册成功，正在跳转...");
      router.push("/dashboard/files");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">知识阅读平台</span>
          </div>
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>注册后即可使用所有功能</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" name="username" type="text" placeholder="你的昵称" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" name="email" type="email" placeholder="your@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" placeholder="至少 6 位" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="再次输入密码" required />
            </div>
            <Button type="submit" className="w-full">注册</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            已有账号？{" "}
            <Link href="/login" className="text-primary hover:underline">
              去登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
