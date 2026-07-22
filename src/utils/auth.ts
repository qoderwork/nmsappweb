/**
 * 认证 Token 管理
 * 统一处理 Token 的读写、过期检查、租户 Header 提取、刷新调度
 */

import { StorageKeys, localStorage } from './storage';

/** JWT Token 默认过期时间（60 分钟） */
const DEFAULT_TOKEN_TTL = 60 * 60;

/** Token 过期前提前刷新的时间（秒），对齐原 nms-web 的 10 分钟 */
const REFRESH_LEAD_TIME = 10 * 60;

/** 刷新失败后的最小重试间隔（秒） */
const MIN_REFRESH_INTERVAL = 30;

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
 * 从 Token 中提取 tenantId（X-License-Id Header 用）
 */
export function getTenantIdFromToken(): string | null {
  const payload = parseTokenPayload<{ tenant_id?: string; tenantId?: string }>();
  return payload?.tenant_id ?? payload?.tenantId ?? null;
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

/**
 * 从 JWT 中获取 Token 的过期时间戳（毫秒）
 */
export function getTokenExpireTimestamp(): number | null {
  const payload = parseTokenPayload<{ exp?: number }>();
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

/**
 * 计算距离 Token 刷新的剩余毫秒数
 * 在过期前 REFRESH_LEAD_TIME（10分钟）触发刷新
 * 如果已过刷新时间，返回最小重试间隔
 */
export function getTokenRefreshDelay(): number | null {
  const expireTs = getTokenExpireTimestamp();
  if (!expireTs) return null;

  const refreshAt = expireTs - REFRESH_LEAD_TIME * 1000;
  const delay = refreshAt - Date.now();

  if (delay < 0) {
    // 已过刷新点，但 Token 可能还没过期，尽快刷新
    return MIN_REFRESH_INTERVAL * 1000;
  }
  return delay;
}

export { StorageKeys } from './storage';
