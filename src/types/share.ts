/**
 * 分享相关类型定义
 */

export type SharePermission = "public" | "password" | "private";

export interface ShareLink {
  id: string;
  file_id: string;
  user_id: string;
  token: string;
  password: string | null; // bcrypt hash，null 表示无密码
  expires_at: string | null; // ISO 时间，null 表示永久
  download_limit: number | null; // 下载次数限制，null 表示无限
  download_count: number;
  view_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 关联数据
  file?: {
    id: string;
    original_name: string;
    file_type: string;
    file_size: number;
    mime_type: string;
  };
}

export interface ShareAccessResult {
  ok: boolean;
  reason?: "expired" | "password_required" | "password_wrong" | "inactive" | "not_found" | "limit_exceeded";
  share?: ShareLink;
  file?: {
    id: string;
    original_name: string;
    file_type: string;
    file_size: number;
    mime_type: string;
  };
}
