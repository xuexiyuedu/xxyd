/**
 * 文件相关类型定义
 */
export type FileType = "pdf" | "epub" | "txt" | "image" | "video" | "audio" | "document" | "archive" | "other";

export interface FileItem {
  id: string;
  user_id: string;
  original_name: string;
  storage_key: string;
  file_size: number;
  file_type: FileType;
  mime_type: string;
  category_id: string | null;
  description: string | null;
  download_count: number;
  view_count: number;
  is_public: boolean;
  access_password: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  version: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  // 关联数据
  category?: Category;
  tags?: Tag[];
}

export interface Category {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  icon: string | null;
  color: string | null;
  children?: Category[];
  file_count?: number;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface FileVersion {
  id: string;
  file_id: string;
  version_number: number;
  storage_key: string;
  file_size: number;
  change_note: string | null;
  created_at: string;
}

export interface AccessLog {
  id: string;
  file_id: string;
  visitor_ip: string;
  visitor_user_id: string | null;
  action: "view" | "download" | "share";
  created_at: string;
}

export interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error" | "paused";
  error?: string;
  uploadedChunks?: number;
  totalChunks?: number;
}
