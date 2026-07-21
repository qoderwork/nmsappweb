/**
 * 认证相关 API
 *
 * 对齐 nmsappsrv 后端：
 * - POST /api/v1/login          登录（返回 { token }）
 * - POST /api/v1/logout         登出
 * - GET  /api/v1/captchaImage   获取验证码
 *
 * 注：修改密码请使用 userApi.modifyPassword（在 user.ts 中）
 */

import { http } from '@/utils/request';
import type {
  LoginParams,
  LoginResult,
  CaptchaResult,
  LoginLog,
} from '@/types';
import type { PageQuery } from '@/types';

/** 登录 */
export function login(params: LoginParams) {
  return http.post<LoginResult, LoginParams>('/login', params, { silent: true });
}

/** 登出 */
export function logout() {
  return http.post<void>('/logout');
}

/** 获取验证码 */
export function getCaptcha() {
  return http.get<CaptchaResult>('/captchaImage', { silent: true });
}

/** 登录日志 */
export function getLoginLogs(params: PageQuery) {
  return http.getPage<LoginLog>('/users/loginlog', params);
}
