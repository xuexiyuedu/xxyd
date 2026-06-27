"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Trash2,
  Power,
  Search,
  Link as LinkIcon,
  Lock,
  Globe,
  Clock,
  Download,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";
import {
  describeExpiry,
  describeDownloadLimit,
  buildShareUrl,
} from "@/lib/share/permission";
import type { ShareLink } from "@/types/share";

export function ShareList() {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadShares = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/share/manage");
      const data = await res.json();
      setShares(data.shares || []);
    } catch {
      setShares([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/share/manage?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      });
      if (!res.ok) throw new Error("操作失败");
      toast.success(current ? "已禁用" : "已启用");
      loadShares();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function deleteShare(id: string) {
    if (!confirm("确定删除此分享链接？")) return;
    try {
      const res = await fetch(`/api/share/manage?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      toast.success("已删除");
      loadShares();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function copyLink(token: string, id: string) {
    const url = buildShareUrl(window.location.origin, token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("链接已复制");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("复制失败");
    }
  }

  const filteredShares = search
    ? shares.filter(
        (s) =>
          s.file?.original_name?.toLowerCase().includes(search.toLowerCase()) ||
          s.token.toLowerCase().includes(search.toLowerCase())
      )
    : shares;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">加载分享列表...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">分享管理</h2>
          <p className="text-sm text-muted-foreground mt-1">
            管理已创建的分享链接，支持启用/禁用、删除
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索文件名或 token..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredShares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <LinkIcon className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {shares.length === 0 ? "还没有分享链接" : "没有匹配的分享"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            在资料管理页面，从文件卡片菜单中点击"分享"即可创建
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShares.map((share) => (
            <Card key={share.id} className="p-4 space-y-3">
              {/* 文件信息 */}
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {share.file?.original_name || "未知文件"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    创建于 {formatRelativeTime(share.created_at)}
                  </p>
                </div>
                <Badge variant={share.is_active ? "default" : "secondary"}>
                  {share.is_active ? "启用" : "禁用"}
                </Badge>
              </div>

              {/* 标签 */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
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

              {/* 链接 + 统计 */}
              <div className="flex gap-2">
                <Input
                  value={buildShareUrl(
                    typeof window !== "undefined" ? window.location.origin : "",
                    share.token
                  )}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyLink(share.token, share.id)}
                  title="复制链接"
                >
                  {copiedId === share.id ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {share.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" /> {share.download_count}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleActive(share.id, share.is_active)}
                    title={share.is_active ? "禁用" : "启用"}
                  >
                    <Power className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteShare(share.id)}
                    title="删除"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
