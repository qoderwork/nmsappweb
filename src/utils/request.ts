/**
 * HTTP 客户端 - 基于 axios 的统一封装
 *
 * 核心特性：
 * 1. 请求拦截：自动注入 Token、X-License-Id Header
 * 2. 响应拦截：业务状态码处理（401 自动跳转登录、错误统一提示）
 * 3. 类型化封装：request<T>() 返回 ApiResponse<T> 的 data
 * 4. 取消请求：基于 AbortController 的 cancel 工厂
 * 5. 静默模式：silent=true 时不弹错误提示
 * 6. 重试机制：网络错误自动重试 1 次
 *
 * 与 nmsappsrv 后端约定：
 * - 响应格式：{ code: 0|非0, message: string, data: T }
 * - 分页响应：{ code, message, data: { total, page, page_size, list: T[] } }
 * - 鉴权 Header：Authorization: Bearer <token>
 * - 租户 Header：X-License-Id: <licenseId>（可从 JWT 中提取）
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import NProgress from 'nprogress';
import { ElMessage } from 'element-plus';

import type { ApiResponse, PageQuery, PageResponse } from '@/types';
import { ApiCode } from '@/types';
import { getToken, clearToken, getLicenseIdFromToken } from './auth';
import {
  BusinessError,
  NetworkError,
  TokenExpiredError,
  PermissionDeniedError,
  isCancelError,
  getErrorMessage,
} from './error';

NProgress.configure({ showSpinner: false, trickleSpeed: 200 });

/** 扩展请求配置 */
export interface RequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /** 是否静默（不显示错误提示） */
  silent?: boolean;
  /** 是否显示进度条（默认 true） */
  progress?: boolean;
  /** 是否直接返回原始响应（默认 false，返回 ApiResponse.data） */
  raw?: boolean;
  /** 取消信号 */
  signal?: AbortSignal;
}

/** 请求实例选项 */
interface RequestOptions {
  baseURL?: string;
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000;

class HttpClient {
  private instance: AxiosInstance;
  private activeRequests = new Map<string, AbortController>();

  constructor(options: RequestOptions = {}) {
    this.instance = axios.create({
      baseURL: options.baseURL ?? '/api/v1',
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    this.setupInterceptors();
  }

  /** 获取 axios 实例（用于特殊场景） */
  getInstance(): AxiosInstance {
    return this.instance;
  }

  /** 设置请求拦截 */
  private setupInterceptors(): void {
    // 请求拦截：注入 Token、License-Id、进度条
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const cfg = config as InternalAxiosRequestConfig & RequestConfig;
        if (cfg.progress !== false) NProgress.start();

        const token = getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 注入租户 ID（X-License-Id）
        const licenseId = getLicenseIdFromToken();
        if (licenseId && config.headers && !config.headers['X-License-Id']) {
          config.headers['X-License-Id'] = licenseId;
        }

        return config;
      },
      (error) => {
        NProgress.done();
        return Promise.reject(error);
      }
    );

    // 响应拦截：业务码处理、错误提示、Token 失效跳转
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        NProgress.done();

        const cfg = response.config as AxiosRequestConfig & RequestConfig;
        const data = response.data;

        // raw 模式直接返回
        if (cfg.raw) return response;

        // 处理业务状态码
        if (data.code === ApiCode.SUCCESS) {
          return response;
        }

        // 业务错误（非 200 状态码但 HTTP 200）
        if (!cfg.silent) {
          ElMessage.error(data.message || '请求失败');
        }
        return Promise.reject(new BusinessError(data.code, data.message, data.data));
      },
      (error: AxiosError<ApiResponse>) => {
        NProgress.done();

        if (isCancelError(error)) {
          return Promise.reject(error);
        }

        const cfg = (error.config ?? {}) as AxiosRequestConfig & RequestConfig;
        const response = error.response;

        // 网络错误 / 超时
        if (!response) {
          if (!cfg.silent) {
            ElMessage.error(
              error.code === 'ECONNABORTED' ? '请求超时，请稍后重试' : '网络异常，请检查网络连接'
            );
          }
          return Promise.reject(new NetworkError(getErrorMessage(error, '网络异常')));
        }

        // HTTP 错误状态码处理
        const status = response.status;
        const data = response.data;

        switch (status) {
          case 401:
          case ApiCode.UNAUTHORIZED:
            return handleUnauthorized(cfg, data);
          case 403:
          case ApiCode.FORBIDDEN:
            if (!cfg.silent) {
              ElMessage.error(data?.message || '您没有权限执行此操作');
            }
            return Promise.reject(new PermissionDeniedError(data?.message));
          case 404:
            if (!cfg.silent) ElMessage.error('请求的资源不存在');
            return Promise.reject(new BusinessError(404, '资源不存在'));
          case 500:
          case ApiCode.INTERNAL_ERROR:
            if (!cfg.silent) {
              ElMessage.error(data?.message || '服务器异常，请稍后重试');
            }
            return Promise.reject(new BusinessError(500, data?.message ?? '服务器异常'));
          default:
            if (!cfg.silent) {
              ElMessage.error(data?.message || `请求失败 (${status})`);
            }
            return Promise.reject(
              new BusinessError(status, data?.message ?? `请求失败 (${status})`)
            );
        }
      }
    );
  }

  /**
   * GET 请求
   */
  async get<T = unknown, D = unknown>(
    url: string,
    config?: RequestConfig<D>
  ): Promise<T> {
    const res = await this.instance.get<ApiResponse<T>>(url, config);
    return res.data.data;
  }

  /**
   * POST 请求
   */
  async post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig<D>
  ): Promise<T> {
    const res = await this.instance.post<ApiResponse<T>>(url, data, config);
    return res.data.data;
  }

  /**
   * PUT 请求
   */
  async put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig<D>
  ): Promise<T> {
    const res = await this.instance.put<ApiResponse<T>>(url, data, config);
    return res.data.data;
  }

  /**
   * PATCH 请求
   */
  async patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: RequestConfig<D>
  ): Promise<T> {
    const res = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return res.data.data;
  }

  /**
   * DELETE 请求
   */
  async delete<T = unknown, D = unknown>(
    url: string,
    config?: RequestConfig<D>
  ): Promise<T> {
    const res = await this.instance.delete<ApiResponse<T>>(url, config);
    return res.data.data;
  }

  /**
   * 分页查询（GET 参数方式）
   * 对齐 nmsappsrv 后端：?page=1&pageSize=20&keyword=xxx
   */
  async getPage<T = unknown>(
    url: string,
    query: Partial<PageQuery> & Record<string, unknown> = {},
    config?: RequestConfig
  ): Promise<{ list: T[]; total: number; page: number; pageSize: number }> {
    const params: Record<string, unknown> = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    };
    // 展开其余查询参数（剔除 page/pageSize）
    Object.keys(query).forEach((k) => {
      if (k !== 'page' && k !== 'pageSize' && query[k] != null && query[k] !== '') {
        params[k] = query[k];
      }
    });

    const res = await this.instance.get<PageResponse<T>>(url, { ...config, params });
    const data = res.data.data;
    return {
      list: data.list,
      total: data.total,
      page: data.page,
      pageSize: data.page_size,
    };
  }

  /**
   * 上传文件
   * @param url 上传地址
   * @param file 文件对象
   * @param fieldName 字段名，默认 file
   * @param onProgress 进度回调
   * @param extraData 额外表单数据
   */
  async upload<T = unknown>(
    url: string,
    file: File | Blob,
    options?: {
      fieldName?: string;
      onProgress?: (percent: number) => void;
      extraData?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    const formData = new FormData();
    const fieldName = options?.fieldName ?? 'file';
    formData.append(fieldName, file);
    if (options?.extraData) {
      Object.entries(options.extraData).forEach(([k, v]) => formData.append(k, v));
    }

    const res = await this.instance.post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (options?.onProgress && e.total) {
          options.onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
      signal: options?.signal,
    });
    return res.data.data;
  }

  /**
   * 下载文件
   */
  async download(
    url: string,
    options?: { params?: Record<string, unknown>; filename?: string }
  ): Promise<void> {
    const res = await this.instance.get<Blob>(url, {
      params: options?.params,
      responseType: 'blob',
    });

    const blob = res.data;
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;

    // 优先从响应头获取文件名
    const disposition = res.headers['content-disposition'] as string | undefined;
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
      if (match?.[1]) {
        link.download = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    } else if (options?.filename) {
      link.download = options.filename;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }

  /**
   * POST 下载文件
   */
  async postDownload(
    url: string,
    data?: unknown,
    options?: { filename?: string }
  ): Promise<void> {
    const res = await this.instance.post<Blob>(url, data, {
      responseType: 'blob',
    });

    const blob = res.data;
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;

    const disposition = res.headers['content-disposition'] as string | undefined;
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
      if (match?.[1]) {
        link.download = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    } else if (options?.filename) {
      link.download = options.filename;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * 处理 401 未授权：清除 Token，跳转登录页
 */
let redirectToLogin: (() => void) | null = null;

function handleUnauthorized(
  cfg: AxiosRequestConfig & RequestConfig,
  data: ApiResponse | undefined
): Promise<never> {
  clearToken();

  if (!cfg.silent) {
    ElMessage.error(data?.message || '登录已过期，请重新登录');
  }

  if (redirectToLogin) redirectToLogin();
  else window.location.href = '/login';

  return Promise.reject(new TokenExpiredError(data?.message));
}

/** 注册 401 跳转登录处理（由 router 守卫注入） */
export function setUnauthorizedHandler(handler: () => void): void {
  redirectToLogin = handler;
}

/** 导出 HTTP 客户端实例（默认 /api/v1 前缀） */
export const http = new HttpClient({ baseURL: '/api/v1' });

/** 北向接口专用实例（前缀不同） */
export const httpV2 = new HttpClient({ baseURL: '/api/v2' });

/** 文件服务专用实例（无 /api 前缀） */
export const httpFile = new HttpClient({ baseURL: '/acs-file-server' });

export { axios };
export type { AxiosInstance, AxiosResponse, AxiosError };
export type { ApiResponse, PageResponse } from '@/types';
