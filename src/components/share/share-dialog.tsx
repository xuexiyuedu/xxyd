"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Link as LinkIcon, Lock, Globe, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  describeExpiry,
  describeDownloadLimit,
  buildShareUrl,
} from "@/lib/share/permission";
import type { ShareLink } from "@/types/share";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
  /** 已存在的分享（如果有） */
  existingShare?: ShareLink | null;
  onShared?: (share: ShareLink) => void;
}

const EXPIRY_OPTIONS = [
  { label: "永久", days: 0 },
  { label: "1 天", days: 1 },
  { label: "7 天", days: 7 },
  { label: "30 天", days: 30 },
];

const DOWNLOAD_LIMIT_OPTIONS = [
  { label: "不限", count: 0 },
  { label: "5 次", count: 5 },
  { label: "10 次", count: 10 },
  { label: "50 次", count: 50 },
];

export function ShareDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  existingShare,
  onShared,
}: ShareDialogProps) {
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(0);
  const [downloadLimit, setDownloadLimit] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [share, setShare] = useState<ShareLink | null>(existingShare || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShare(existingShare || null);
  }, [existingShare, open]);

  const shareUrl = share
    ? buildShareUrl(
        typeof window !== "undefined" ? window.location.origin : "",
        share.token
      )
    : "";

  async function handleCreate() {
    if (usePassword && password.length < 4) {
      toast.error("密码至少 4 位");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: fileId,
          password: usePassword ? password : null,
          expires_in_days: expiresInDays,
          download_limit: downloadLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "创建分享失败");
      }
      setShare(data.share);
      onShared?.(data.share);
      toast.success("分享链接已创建");
    } catch (e: any) {
      toast.error(e.message || "创建分享失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  }

  async function toggleActive() {
    if (!share) return;
    try {
      const res = await fetch(`/api/share/manage?id=${share.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !share.is_active }),
      });
      if (!res.ok) throw new Error("操作失败");
      const data = await res.json();
      setShare({ ...share, ...data.share });
      toast.success(share.is_active ? "已禁用分享" : "已启用分享");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function deleteShare() {
    if (!share) return;
    if (!confirm("确定删除此分享链接？删除后访客将无法访问。")) return;
    try {
      const res = await fetch(`/api/share/manage?id=${share.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除失败");
      toast.success("分享已删除");
      setShare(null);
      onShared?.(null as any);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            分享文件
          </DialogTitle>
          <DialogDescription className="truncate">
            {fileName}
          </DialogDescription>
        </DialogHeader>

        {share ? (
          /* 已有分享链接 — 展示与操作 */
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={share.is_active ? "default" : "secondary"}>
                {share.is_active ? "已启用" : "已禁用"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                {share.password ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {share.password ? "需密码" : "公开"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {describeExpiry(share)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Download className="h-3 w-3" />
                {describeDownloadLimit(share)}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>分享链接</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={copyLink} title="复制链接">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">浏览</p>
                <p className="text-base font-semibold">{share.view_count}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">下载</p>
                <p className="text-base font-semibold">{share.download_count}</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">创建</p>
                <p className="text-base font-semibold">
                  {new Date(share.created_at).toLocaleDateString("zh-CN")}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={toggleActive}>
                {share.is_active ? "禁用" : "启用"}
              </Button>
              <Button variant="destructive" onClick={deleteShare}>
                删除分享
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* 创建新分享 */
          <div className="space-y-4">
            {/* 密码保护 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-password" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> 密码保护
                </Label>
                <input
                  id="use-password"
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              {usePassword && (
                <Input
                  type="text"
                  placeholder="输入访问密码（至少 4 位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </div>

            {/* 有效期 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> 有效期
              </Label>
              <div className="flex gap-2 flex-wrap">
                {EXPIRY_OPTIONS.map((opt) => (
                  <Button
                    key={opt.days}
                    variant={expiresInDays === opt.days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpiresInDays(opt.days)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 下载次数限制 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Download className="h-3 w-3" /> 下载次数限制
              </Label>
              <div className="flex gap-2 flex-wrap">
                {DOWNLOAD_LIMIT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.count}
                    variant={downloadLimit === opt.count ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDownloadLimit(opt.count)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "创建中..." : "创建分享链接"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
