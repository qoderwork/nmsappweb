/**
 * API 通用类型定义
 * 对齐 nmsappsrv 后端响应格式：{ code, message, data }
 */

/** 业务状态码 */
export enum ApiCode {
  SUCCESS = 200,
  FAIL = 1,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
  NEED_CAPTCHA = 40001,
  TOKEN_EXPIRED = 401001,
}

/** 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  /** 后端可选字段，例如登录时返回是否需要验证码 */
  [key: string]: unknown;
}

/** 分页响应结构（与 nmsappsrv 对齐） */
export interface PageResponse<T = unknown> {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    page_size: number;
    list: T[];
  };
}

/** 分页查询参数 */
export interface PageQuery {
  page: number;
  pageSize: number;
  /** 关键字搜索 */
  keyword?: string;
  /** 排序字段 */
  orderBy?: string;
  /** asc | desc */
  order?: 'asc' | 'desc';
  /** 索引签名：允许任意扩展查询参数 */
  [key: string]: unknown;
}

/** 通用 ID 参数 */
export interface IdParam {
  id: string | number;
}

/** 批量操作参数 */
export interface BatchParams<T = string | number> {
  ids: T[];
}

/** 树形数据节点 */
export interface TreeNode<T = unknown> {
  id: string | number;
  label: string;
  parentId?: string | number | null;
  children?: TreeNode<T>[];
  raw?: T;
}

/** 选项数据 */
export interface Option<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
  children?: Option<T>[];
}

/** 时间范围查询 */
export interface DateRangeQuery {
  startTime?: string;
  endTime?: string;
}

/** 操作结果 */
export interface OperationResult {
  success: boolean;
  message?: string;
  data?: unknown;
}
