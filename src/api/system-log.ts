/**
 * 系统日志 API（操作日志）
 *
 * 对齐 nmsappsrv 后端 misc/routes.go
 * - GET/POST /system/operator-logs   操作日志列表（分页+过滤）
 */
import { http } from '@/utils/request';
import type { OperationLog, OperationLogQuery } from '@/types/system-log';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 查询操作日志（支持 GET 和 POST） */
export function listOperationLogs(query: OperationLogQuery) {
  return http.post<PagedResult<OperationLog>>('/system/operator-logs', query);
}
