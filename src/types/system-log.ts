/**
 * 系统日志类型定义（操作日志）
 *
 * 对齐老版 nms-web OperationLogs 字段。
 * 注意：后端端点待最终确认，此处按 REST 风格约定 /operation-logs。
 */

/** 操作日志实体 */
export interface OperationLog {
  id: number;
  tenancyName?: string | null;
  username?: string | null;
  ipAddress?: string | null;
  logName?: string | null;
  recordDetail?: string | null;
  results?: string | null;
  failureReason?: string | null;
  operationTime?: string | null;
}

/** 操作日志查询参数 */
export interface OperationLogQuery {
  username?: string;
  ipAddress?: string;
  logName?: string;
  recordDetail?: string;
  results?: string;
  startTime?: string;
  endTime?: string;
  page: number;
  pageSize: number;
}
