"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, BookOpen, Leaf, Type, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/auth/supabase-browser";
import { toast } from "sonner";
import type { ReadingSettings, ReaderTheme } from "@/types/reading";

interface ReaderSettingsProps {
  settings: ReadingSettings | null;
  onUpdate: (settings: ReadingSettings) => void;
  onClose: () => void;
}

const THEMES: { value: ReaderTheme; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: "light", label: "明亮", icon: Sun, color: "#FFFFFF" },
  { value: "sepia", label: "护眼黄", icon: BookOpen, color: "#F4ECD8" },
  { value: "dark", label: "暗黑", icon: Moon, color: "#1A1A1A" },
  { value: "green", label: "护眼绿", icon: Leaf, color: "#CCE8CF" },
];

const FONTS = [
  { value: "system-ui", label: "系统默认" },
  { value: "Noto Serif SC, serif", label: "思源宋体" },
  { value: "LXGW WenKai, serif", label: "霞鹜文楷" },
  { value: "Georgia, serif", label: "Georgia" },
];

export function ReaderSettings({ settings, onUpdate, onClose }: ReaderSettingsProps) {
  const [local, setLocal] = useState<ReadingSettings | null>(settings);

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  async function saveSettings() {
    if (!local) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("reading_settings")
      .upsert({ ...local, user_id: user.id }, { onConflict: "user_id" });

    if (error) {
      toast.error("保存设置失败");
    } else {
      onUpdate(local);
      toast.success("设置已保存");
      onClose();
    }
  }

  function update<K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) {
    if (!local) return;
    setLocal({ ...local, [key]: value });
  }

  if (!local) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>阅读设置</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 主题 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">阅读主题</label>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors",
                    local.theme === value ? "border-primary" : "border-transparent hover:border-muted"
                  )}
                  onClick={() => update("theme", value)}
                >
                  <div
                    className="h-10 w-full rounded-md border"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="h-full w-full p-1 text-gray-600" />
                  </div>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* 字体大小 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">字体大小</label>
              <span className="text-sm tabular-nums">{local.font_size}px</span>
            </div>
            <Slider
              min={12}
              max={28}
              step={1}
              value={[local.font_size]}
              onValueChange={([v]) => update("font_size", v)}
            />
          </div>

          {/* 行高 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">行高</label>
              <span className="text-sm tabular-nums">{local.line_height}</span>
            </div>
            <Slider
              min={1.2}
              max={2.5}
              step={0.1}
              value={[local.line_height]}
              onValueChange={([v]) => update("line_height", v)}
            />
          </div>

          {/* 字间距 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">字间距</label>
              <span className="text-sm tabular-nums">{local.letter_spacing}px</span>
            </div>
            <Slider
              min={-0.5}
              max={3}
              step={0.5}
              value={[local.letter_spacing]}
              onValueChange={([v]) => update("letter_spacing", v)}
            />
          </div>

          <Separator />

          {/* 字体选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">字体</label>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(({ value, label }) => (
                <button
                  key={value}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    local.font_family === value
                      ? "border-primary bg-primary/10"
                      : "hover:bg-accent"
                  )}
                  style={{ fontFamily: value }}
                  onClick={() => update("font_family", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 阅读目标 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">每日阅读目标</label>
              <span className="text-sm tabular-nums">{local.reading_goal_minutes} 分钟</span>
            </div>
            <Slider
              min={10}
              max={120}
              step={5}
              value={[local.reading_goal_minutes]}
              onValueChange={([v]) => update("reading_goal_minutes", v)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={saveSettings}>保存设置</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
