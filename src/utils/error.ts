/**
 * 错误处理工具
 * 统一处理 API 错误、网络错误、业务异常
 */

import { ElMessage, ElMessageBox } from 'element-plus';
import type { ApiResponse } from '@/types';
import { ApiCode } from '@/types';

/** 业务错误 */
export class BusinessError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.data = data;
  }
}

/** 网络错误 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/** Token 失效错误 */
export class TokenExpiredError extends Error {
  constructor(message = '登录已过期，请重新登录') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

/** 权限不足错误 */
export class PermissionDeniedError extends Error {
  constructor(message = '您没有权限执行此操作') {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * 判断是否为取消请求错误（axios.isCancel）
 */
export function isCancelError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name: string }).name === 'CanceledError'
  );
}

/**
 * 从未知错误中提取消息
 */
export function getErrorMessage(error: unknown, fallback = '操作失败'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}

/**
 * 从未知错误中提取业务状态码
 */
export function getApiCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as { code?: number; response?: { data?: { code?: number } } };
  if (typeof e.code === 'number') return e.code;
  if (e.response?.data?.code != null) return e.response.data.code;
  return null;
}

/**
 * 显示错误消息（ElMessage）
 * @param error 错误对象
 * @param fallback 默认消息
 */
export function showErrorMessage(error: unknown, fallback = '操作失败'): void {
  if (isCancelError(error)) return;
  const message = getErrorMessage(error, fallback);
  ElMessage.error(message);
}

/**
 * 显示成功消息
 */
export function showSuccessMessage(message = '操作成功'): void {
  ElMessage.success(message);
}

/**
 * 显示警告消息
 */
export function showWarningMessage(message = '操作有风险'): void {
  ElMessage.warning(message);
}

/**
 * 二次确认对话框
 */
export async function confirm(
  message: string,
  title = '提示',
  options?: { type?: 'success' | 'warning' | 'info' | 'error'; confirmText?: string; cancelText?: string }
): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, title, {
      type: options?.type ?? 'warning',
      confirmButtonText: options?.confirmText ?? '确定',
      cancelButtonText: options?.cancelText ?? '取消',
      confirmButtonClass: 'el-button--primary',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 根据 ApiResponse 处理业务结果，失败时抛出 BusinessError
 */
export function assertApiSuccess<T>(response: ApiResponse<T>): T {
  if (response.code === ApiCode.SUCCESS) {
    return response.data;
  }
  if (response.code === ApiCode.UNAUTHORIZED || response.code === ApiCode.TOKEN_EXPIRED) {
    throw new TokenExpiredError(response.message || '登录已过期');
  }
  if (response.code === ApiCode.FORBIDDEN) {
    throw new PermissionDeniedError(response.message);
  }
  throw new BusinessError(response.code, response.message || '操作失败', response.data);
}

/**
 * 全局错误处理器（注册到 app.config.errorHandler）
 */
export function setupErrorHandler(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (isCancelError(error)) {
      event.preventDefault();
      return;
    }
    console.error('[Unhandled Rejection]', error);
  });
}
