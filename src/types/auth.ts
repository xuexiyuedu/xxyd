/**
 * 认证相关类型定义
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  storage_used: number;
  storage_limit: number;
  role: "user" | "admin" | "premium";
  created_at: string;
}

export interface AuthSession {
  user: UserProfile | null;
  isLoading: boolean;
}
