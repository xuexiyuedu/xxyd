"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  BookOpen,
  FileText,
  Lock,
  Globe,
  Clock,
  Download,
  Eye,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { describeExpiry, describeDownloadLimit } from "@/lib/share/permission";
import { FileViewer } from "@/components/preview/file-viewer";

interface ShareState {
  status: "loading" | "need_password" | "ready" | "error";
  reason?: string;
  share?: any;
  file?: any;
  previewUrl?: string;
}

export default function ShareTokenPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<ShareState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchShareMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchShareMeta() {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/share/${token}`);
      const data = await res.json();

      if (!data.ok) {
        setState({
          status: "error",
          reason: data.reason || "unknown",
        });
        return;
      }

      const share = data.share;

      if (share.has_password) {
        // 需要密码
        setState({
          status: "need_password",
          share,
          file: share.file,
        });
      } else {
        // 公开分享，记录访问并准备预览
        await fetch(`/api/share/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "record_view" }),
        });

        const previewUrl = await getPreviewUrl(share.file_id);
        setState({
          status: "ready",
          share: { ...share, password_verified: true },
          file: share.file,
          previewUrl,
        });
      }
    } catch (e: any) {
      setState({ status: "error", reason: e.message });
    }
  }

  async function getPreviewUrl(fileId: string): Promise<string> {
    try {
      const res = await fetch(`/api/files/${fileId}/preview`);
      const data = await res.json();
      return data.url || "";
    } catch {
      return "";
    }
  }

  async function handleVerifyPassword() {
    if (!password) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/share/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_password", password }),
      });
      const data = await res.json();

      if (!data.ok) {
        setState((s) => ({
          ...s,
          reason: data.reason,
        }));
        return;
      }

      const previewUrl = await getPreviewUrl(data.share.file_id);
      setState({
        status: "ready",
        share: data.share,
        file: data.share.file,
        previewUrl,
      });
    } catch (e: any) {
      setState({ status: "error", reason: e.message });
    } finally {
      setVerifying(false);
    }
  }

  async function handleDownload() {
    if (!state.file) return;
    try {
      await fetch(`/api/share/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "record_download" }),
      });
    } catch {
      // ignore
    }
    if (state.previewUrl) {
      window.open(state.previewUrl, "_blank");
    }
  }

  // ============ Loading ============
  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">正在加载分享内容...</p>
      </div>
    );
  }

  // ============ Error ============
  if (state.status === "error") {
    const reasonMap: Record<string, { title: string; desc: string }> = {
      not_found: { title: "分享不存在", desc: "此链接无效或已被删除" },
      expired: { title: "分享已过期", desc: "请联系分享者获取新的链接" },
      inactive: { title: "分享已禁用", desc: "分享者已暂时关闭此链接" },
      limit_exceeded: { title: "下载次数已用尽", desc: "请联系分享者重新设置" },
      unknown: { title: "出错了", desc: "请稍后重试" },
    };
    const info = reasonMap[state.reason || "unknown"] || reasonMap.unknown;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 px-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold">{info.title}</h1>
        <p className="text-sm text-muted-foreground">{info.desc}</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> 返回首页
          </Button>
        </Link>
      </div>
    );
  }

  // ============ Need password ============
  if (state.status === "need_password") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">需要访问密码</h1>
          <p className="text-sm text-muted-foreground">
            此分享链接受密码保护，请输入密码后查看
          </p>
        </div>

        {state.file && (
          <Card className="w-full max-w-md p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate">
                {state.file.original_name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatFileSize(state.file.file_size)}</span>
            </div>
          </Card>
        )}

        <div className="w-full max-w-md space-y-3">
          <div className="space-y-2">
            <Label htmlFor="password">访问密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerifyPassword();
              }}
              autoFocus
            />
          </div>
          {state.reason === "password_wrong" && (
            <p className="text-xs text-destructive">密码错误，请重试</p>
          )}
          <Button
            className="w-full"
            onClick={handleVerifyPassword}
            disabled={verifying || !password}
          >
            {verifying ? "验证中..." : "确认访问"}
          </Button>
        </div>

        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> 返回首页
          </Button>
        </Link>
      </div>
    );
  }

  // ============ Ready ============
  const share = state.share;
  const file = state.file;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 顶部品牌栏 */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold">知识阅读</span>
          </Link>
          <Badge variant="secondary" className="gap-1">
            <Globe className="h-3 w-3" /> 公开分享
          </Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6">
        {/* 文件卡片 */}
        <Card className="p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold break-all">
                {file?.original_name || "未知文件"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{formatFileSize(file?.file_size || 0)}</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {share?.view_count || 0} 次浏览
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" /> {share?.download_count || 0} 次下载
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1">
                  {share?.password ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  {share?.password ? "需密码" : "公开"}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {describeExpiry(share || {})}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Download className="h-3 w-3" />
                  {describeDownloadLimit(share || {})}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setPreviewOpen(true)} disabled={!state.previewUrl}>
              <Eye className="h-4 w-4 mr-2" /> 在线预览
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={!state.previewUrl}>
              <Download className="h-4 w-4 mr-2" /> 下载
            </Button>
            {["pdf", "epub", "txt"].includes(file?.file_type) && (
              <p className="w-full mt-2 text-xs text-muted-foreground">
                💡 提示：如需深度阅读（高亮、笔记），请注册账号并上传自己的副本。
              </p>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          此页面由分享者通过「知识阅读」平台生成 · 分享内容版权归原上传者所有
        </p>
      </main>

      {/* 预览弹窗 */}
      {previewOpen && file && state.previewUrl && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogTitle className="sr-only">{file.original_name} 预览</DialogTitle>
            <div className="h-full overflow-auto">
              <FileViewer file={file} url={state.previewUrl} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
