/**
 * 系统日志 API（操作日志）
 *
 * 注意：后端端点待最终确认，此处按 REST 风格约定 /operation-logs。
 * 登录日志请复用 api/auth.ts 的 getLoginLogs。
 */

import { http } from '@/utils/request';
import type { OperationLog, OperationLogQuery } from '@/types/system-log';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

/** 查询操作日志 */
export function listOperationLogs(query: OperationLogQuery) {
  return http.post<PagedResult<OperationLog>>('/operation-logs', query);
}
