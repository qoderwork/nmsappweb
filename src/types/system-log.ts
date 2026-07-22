/**
 * 系统日志类型定义（操作日志）
 *
 * 对齐 nmsappsrv 后端 misc/repository.go SystemOperatorLogVo
 */
export interface OperationLog {
  id: number;
  tenancyName?: string | null;
  username?: string | null;
  ipAddress?: string | null;
  logName?: string | null;
  recordDetail?: string | null;
  results?: number | null;
  failureReason?: string | null;
  operationStartTime?: string | null;
  operationEndTime?: string | null;
}

export interface OperationLogQuery {
  username?: string;
  ipAddress?: string;
  logName?: string;
  recordDetail?: string;
  results?: number;
  startTime?: string;
  endTime?: string;
  page: number;
  pageSize: number;
}
