"use client";

import { useState } from "react";
import { useAuthStore } from "@/hooks/use-auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, MailCheck } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuthStore();
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const { error } = await resetPassword(email);
    if (error) {
      toast.error(error);
    } else {
      setSent(true);
      toast.success("重置链接已发送到你的邮箱");
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
          <CardTitle className="text-2xl">找回密码</CardTitle>
          <CardDescription>输入注册邮箱，我们会发送重置链接</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <MailCheck className="h-16 w-16 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                重置链接已发送到你的邮箱，请检查收件箱（包括垃圾邮件文件夹）。
              </p>
              <Link href="/login">
                <Button variant="outline">返回登录</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" name="email" type="email" placeholder="your@email.com" required />
              </div>
              <Button type="submit" className="w-full">发送重置链接</Button>
              <div className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  返回登录
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
