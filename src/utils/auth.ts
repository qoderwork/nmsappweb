/**
 * 认证 Token 管理
 * 统一处理 Token 的读写、过期检查、租户 Header 提取
 */

import { StorageKeys, localStorage } from './storage';

/** JWT Token 默认过期时间（60 分钟） */
const DEFAULT_TOKEN_TTL = 60 * 60;

/**
 * 获取 Token
 */
export function getToken(): string | null {
  const token = localStorage.get<string>(StorageKeys.TOKEN);
  if (!token) return null;

  const expire = localStorage.get<number>(StorageKeys.TOKEN_EXPIRE);
  if (expire && Date.now() > expire) {
    clearToken();
    return null;
  }
  return token;
}

/**
 * 设置 Token
 * @param token JWT Token
 * @param ttl 存活时间（秒），默认 3600
 */
export function setToken(token: string, ttl = DEFAULT_TOKEN_TTL): void {
  localStorage.set(StorageKeys.TOKEN, token);
  if (ttl > 0) {
    localStorage.set(StorageKeys.TOKEN_EXPIRE, Date.now() + ttl * 1000);
  }
}

/**
 * 清除 Token 及其过期时间
 */
export function clearToken(): void {
  localStorage.remove(StorageKeys.TOKEN);
  localStorage.remove(StorageKeys.TOKEN_EXPIRE);
}

/**
 * 判断是否已登录（Token 存在且未过期）
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * 从 JWT Token 解析载荷（不校验签名，仅用于读取信息）
 */
export function parseTokenPayload<T = Record<string, unknown>>(token?: string): T | null {
  const t = token ?? getToken();
  if (!t) return null;
  try {
    const parts = t.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // 处理 base64url
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('[Auth] Failed to parse token payload:', e);
    return null;
  }
}

/**
 * 从 Token 中提取 licenseId（X-License-Id Header 用）
 */
export function getLicenseIdFromToken(): string | null {
  const payload = parseTokenPayload<{ license_id?: string; licenseId?: string }>();
  return payload?.license_id ?? payload?.licenseId ?? null;
}

/**
 * 获取 Token 剩余有效时长（秒）
 */
export function getTokenRemainingTime(): number {
  const expire = localStorage.get<number>(StorageKeys.TOKEN_EXPIRE);
  if (!expire) return 0;
  return Math.max(0, Math.floor((expire - Date.now()) / 1000));
}

/**
 * 判断 Token 是否即将过期（小于 5 分钟）
 */
export function isTokenExpiringSoon(): boolean {
  return getTokenRemainingTime() < 5 * 60;
}

export { StorageKeys } from './storage';
