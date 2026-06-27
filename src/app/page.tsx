"use client";

import Link from "next/link";
import { BookOpen, FolderOpen, Highlighter, StickyNote, BarChart3, Brain, Languages, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FolderOpen,
    title: "资料管理",
    desc: "支持 PDF、EPUB、TXT 等多格式文件上传，分片上传、断点续传、分类管理一应俱全",
    color: "text-blue-500",
  },
  {
    icon: BookOpen,
    title: "多引擎阅读器",
    desc: "PDF / EPUB / TXT 三大阅读引擎，支持文本选择、目录导航、缩放控制",
    color: "text-purple-500",
  },
  {
    icon: Highlighter,
    title: "高亮批注",
    desc: "五种颜色高亮、下划线、删除线标注，支持添加笔记，随时回顾重点",
    color: "text-yellow-500",
  },
  {
    icon: StickyNote,
    title: "智能笔记",
    desc: "阅读笔记自动关联来源文件，支持搜索、标签管理和一键导出 Markdown",
    color: "text-green-500",
  },
  {
    icon: Brain,
    title: "闪卡复习",
    desc: "基于 SM-2 间隔重复算法的生词本和闪卡系统，科学记忆，高效复习",
    color: "text-red-500",
  },
  {
    icon: Languages,
    title: "词典翻译",
    desc: "选中单词即时查词翻译，支持音标发音和例句，一键加入生词本",
    color: "text-indigo-500",
  },
  {
    icon: BarChart3,
    title: "阅读统计",
    desc: "追踪每日阅读时长、进度和连续天数，可视化图表帮你养成阅读习惯",
    color: "text-orange-500",
  },
  {
    icon: Smartphone,
    title: "PWA 离线",
    desc: "支持离线缓存和 Service Worker，安装到桌面随时使用，番茄钟专注模式",
    color: "text-cyan-500",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">知识阅读平台</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link href="/dashboard/files">
              <Button size="sm">进入平台</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          资料管理 + 学习阅读 一体化
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          让每一本书都留下你的印记
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          上传你的电子资料，在沉浸式阅读器中标注重点、记录笔记、管理生词，
          用间隔重复算法科学复习，用数据可视化追踪阅读进度。
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard/files">
            <Button size="lg" className="gap-2">
              <BookOpen className="h-4 w-4" />
              立即体验
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">登录 / 注册</Button>
          </Link>
        </div>
      </section>

      {/* 功能卡片 */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border bg-white p-5 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-3 ${feature.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 底部 */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>知识阅读平台 &mdash; 资料管理 + 学习阅读一体化系统</p>
          <p className="mt-1">基于 Next.js 14 + Supabase + Tailwind CSS 构建</p>
        </div>
      </footer>
    </div>
  );
}
