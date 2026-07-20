/**
 * 事件日志 API
 * 对齐 nmsappsrv 后端 eventlog/routes.go
 */

import { http } from '@/utils/request';
import type { EventLog, EventLogQueryParams } from '@/types/event-log';

/** 获取事件日志列表 */
export function getEventLogs(params: EventLogQueryParams = {}) {
  return http.getPage<EventLog>('/event-logs', params);
}

/** 获取事件日志详情 */
export function getEventLog(id: number) {
  return http.get<EventLog>(`/event-logs/${id}`);
}

/** 获取任务关联事件日志 */
export function getTaskEventLogs(taskId: number, taskType?: string) {
  const params: Record<string, string> = {};
  if (taskType) params.task_type = taskType;
  return http.get<EventLog[]>(`/event-logs/task/${taskId}`, { params });
}
