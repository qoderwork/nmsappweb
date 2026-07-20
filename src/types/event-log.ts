/**
 * 事件日志类型定义
 * 对齐 nmsappsrv 后端 eventlog/model.go
 */

/** 事件日志 */
export interface EventLog {
  id: number;
  event_type?: string | null;
  operation_time?: string | null;
  command_issue_time?: string | null;
  command_response_time?: string | null;
  user?: string | null;
  element_id?: number | null;
  status?: number | null;
  fault_info?: string | null;
  command_track_data?: string | null;
}

/** 任务关联事件日志 */
export interface TaskToEventLog {
  id: number;
  task_id?: number | null;
  event_log_id?: number | null;
  task_type?: string | null;
}

/** 事件日志查询参数 */
export interface EventLogQueryParams {
  page?: number;
  pageSize?: number;
  element_id?: number;
  event_type?: string;
  [key: string]: unknown;
}
