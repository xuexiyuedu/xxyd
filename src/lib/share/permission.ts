/**
 * 分享权限检查工具函数
 * - Mock 模式下密码以明文比较（仅用于本地开发演示）
 * - 真实环境使用 bcrypt.compare
 */

import type { ShareLink, ShareAccessResult } from "@/types/share";

/**
 * 检查分享链接是否已过期
 */
export function isExpired(share: Pick<ShareLink, "expires_at">): boolean {
  if (!share.expires_at) return false;
  return new Date(share.expires_at).getTime() < Date.now();
}

/**
 * 检查下载次数是否超限
 */
export function isDownloadLimited(
  share: Pick<ShareLink, "download_limit" | "download_count">
): boolean {
  if (share.download_limit === null) return false;
  return share.download_count >= share.download_limit;
}

/**
 * 验证密码
 * - Mock 模式：明文比较（密码字符串带 "mock:" 前缀）
 * - 真实环境：使用 bcrypt.compare
 */
export async function verifyPassword(
  plain: string,
  hash: string | null
): Promise<boolean> {
  if (!hash) return true; // 无密码限制
  if (!plain) return false;

  // Mock 模式：hash 以 "mock:" 前缀存储
  if (hash.startsWith("mock:")) {
    return plain === hash.slice(5);
  }

  // 真实环境使用 bcrypt
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(plain, hash);
  } catch {
    // bcryptjs 未安装时降级为明文比较
    return plain === hash;
  }
}

/**
 * 生成分享 token（短且唯一）
 * - 使用 crypto.randomUUID + base36 截断，得到 16 位短串
 */
export function generateShareToken(): string {
  const uuid = crypto.randomUUID().replace(/-/g, "");
  return uuid.slice(0, 16);
}

/**
 * 生成密码 hash
 * - Mock 模式：使用 "mock:" 前缀
 * - 真实环境：使用 bcrypt
 */
export async function hashPassword(
  plain: string | null
): Promise<string | null> {
  if (!plain) return null;

  // Mock 模式标记
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
    return `mock:${plain}`;
  }

  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.hash(plain, 10);
  } catch {
    return `mock:${plain}`;
  }
}

/**
 * 完整的访问权限检查
 */
export function checkShareAccess(
  share: ShareLink | null
): ShareAccessResult {
  if (!share) {
    return { ok: false, reason: "not_found" };
  }
  if (!share.is_active) {
    return { ok: false, reason: "inactive" };
  }
  if (isExpired(share)) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, share };
}

/**
 * 构造完整分享 URL
 */
export function buildShareUrl(
  baseUrl: string,
  token: string
): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/share/${token}`;
}

/**
 * 格式化有效期描述
 */
export function describeExpiry(share: Pick<ShareLink, "expires_at">): string {
  if (!share.expires_at) return "永久有效";
  const diff = new Date(share.expires_at).getTime() - Date.now();
  if (diff <= 0) return "已过期";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `剩余 ${days} 天`;
  if (hours > 0) return `剩余 ${hours} 小时`;
  return "即将过期";
}

/**
 * 格式化下载限制描述
 */
export function describeDownloadLimit(
  share: Pick<ShareLink, "download_limit" | "download_count">
): string {
  if (share.download_limit === null) return "不限下载次数";
  const remaining = share.download_limit - share.download_count;
  if (remaining <= 0) return "下载次数已用尽";
  return `剩余 ${remaining} / ${share.download_limit} 次`;
}
