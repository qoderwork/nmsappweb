/**
 * 告警管理 API
 *
 * 对齐 nmsappsrv 后端 internal/alarm/routes.go
 * - GET    /api/v1/alarms                    告警列表（分页）
 * - GET    /api/v1/alarms/:id                告警详情
 * - DELETE /api/v1/alarms/:id                删除告警
 * - POST   /api/v1/alarms/:id/clear          清除告警
 * - POST   /api/v1/alarms/:id/confirm        确认告警
 * - POST   /api/v1/alarms/:id/unconfirm      取消确认告警
 * - PUT    /api/v1/alarms/batch-clear        批量清除告警
 * - POST   /api/v1/alarms/:id/comment        添加告警评论
 * - GET    /api/v1/alarms/severity-count     获取严重级别统计
 * - GET    /api/v1/alarms/statistic/top-n    告警统计 TopN
 * - POST   /api/v1/alarms/statistic          告警统计
 * - GET    /api/v1/alarm-library             告警库列表
 * - DELETE /api/v1/alarm-library/:id         删除告警库
 * - POST   /api/v1/alarm-library/import      导入告警库
 * - GET    /api/v1/alarm-library/template    下载告警库模板
 * - GET    /api/v1/alarm-templates           告警模板列表
 * - POST   /api/v1/alarm-templates           创建告警模板
 * - PUT    /api/v1/alarm-templates/:id       更新告警模板
 * - GET    /api/v1/alarm-templates/:id       获取告警模板
 * - DELETE /api/v1/alarm-templates/:id       删除告警模板
 */

import { http } from '@/utils/request';
import type {
  Alarm,
  AlarmQueryParams,
  AlarmStatisticResult,
  SeverityCount,
  AlarmStatisticTopN,
  AlarmLibrary,
  AlarmTemplate,
  AlarmFilter,
  AlarmSyncConfig,
  EmailNotificationConfig,
  AddCommentRequest,
} from '@/types';

/* ============ 告警管理 ============ */

/** 获取告警列表（分页） */
export function getAlarms(params: AlarmQueryParams = {}) {
  return http.getPage<Alarm>('/alarms', params);
}

/** 获取告警详情 */
export function getAlarm(id: number | string) {
  return http.get<Alarm>(`/alarms/${id}`);
}

/** 删除告警 */
export function deleteAlarm(id: number | string) {
  return http.delete<void>(`/alarms/${id}`);
}

/** 清除告警 */
export function clearAlarm(id: number | string) {
  return http.post<void>(`/alarms/${id}/clear`);
}

/** 确认告警 */
export function confirmAlarm(id: number | string) {
  return http.post<void>(`/alarms/${id}/confirm`);
}

/** 取消确认告警 */
export function unconfirmAlarm(id: number | string) {
  return http.post<void>(`/alarms/${id}/unconfirm`);
}

/** 批量清除告警 */
export function batchClearAlarms(ids: (number | string)[]) {
  return http.put<void, { ids: (number | string)[] }>('/alarms/batch-clear', { ids });
}

/** 添加告警评论 */
export function addCommentForAlarm(id: number | string, data: AddCommentRequest) {
  return http.post<void>(`/alarms/${id}/comment`, data);
}

/** 获取严重级别统计 */
export function getSeverityCount() {
  return http.get<SeverityCount[]>('/alarms/severity-count');
}

/** 获取告警统计 TopN */
export function getAlarmStatisticTopN(n: number = 10) {
  return http.get<AlarmStatisticTopN[]>('/alarms/statistic/top-n', { params: { n } });
}

/** 获取告警统计 */
export function getAlarmStatistic(params?: { startTime?: string; endTime?: string }) {
  return http.post<AlarmStatisticResult>('/alarms/statistic', params);
}

/** 获取活跃告警可能原因列表 */
export function getActiveAlarmProbableCause() {
  return http.get<string[]>('/alarms/active-probable-causes');
}

/** 获取告警事件类型 */
export function getAlarmEventType(params?: { eventType?: string }) {
  return http.post<string[]>('/alarms/event-type', params);
}

/** 获取邮件通知结果列表 */
export function getEmailNoticeResults(params?: { alarmTemplateId?: number; emailSubject?: string }) {
  return http.post<any[]>('/alarms/email-notice-results', params);
}

/* ============ 告警库 ============ */

/** 获取告警库列表 */
export function getAlarmLibrary() {
  return http.get<AlarmLibrary[]>('/alarm-library');
}

/** 删除告警库 */
export function deleteAlarmLibrary(id: number | string) {
  return http.delete<void>(`/alarm-library/${id}`);
}

/** 导入告警库 */
export function importAlarmLibrary(file: File) {
  return http.upload<void>('/alarm-library/import', file);
}

/** 下载告警库模板 */
export function downloadAlarmLibraryTemplate() {
  return http.download('/alarm-library/template', { filename: 'alarm_library_template.xlsx' });
}

/* ============ 告警模板 ============ */

/** 获取告警模板列表 */
export function getAlarmTemplates() {
  return http.get<AlarmTemplate[]>('/alarm-templates');
}

/** 创建告警模板 */
export function createAlarmTemplate(data: Partial<AlarmTemplate>) {
  return http.post<AlarmTemplate, Partial<AlarmTemplate>>('/alarm-templates', data);
}

/** 更新告警模板 */
export function updateAlarmTemplate(id: number | string, data: Partial<AlarmTemplate>) {
  return http.put<AlarmTemplate, Partial<AlarmTemplate>>(`/alarm-templates/${id}`, data);
}

/** 获取告警模板详情 */
export function getAlarmTemplate(id: number | string) {
  return http.get<AlarmTemplate>(`/alarm-templates/${id}`);
}

/** 删除告警模板 */
export function deleteAlarmTemplate(id: number | string) {
  return http.delete<void>(`/alarm-templates/${id}`);
}

/** 更新告警模板邮件通知配置 */
export function updateAlarmTemplateEmailNotification(id: number | string, data: Partial<AlarmTemplate>) {
  return http.put<void, Partial<AlarmTemplate>>(`/alarm-templates/${id}/email-notification`, data);
}

/* ============ 告警过滤器 ============ */

/** 获取告警过滤器列表 */
export function getAlarmFilters() {
  return http.get<AlarmFilter[]>('/alarm-filters');
}

/** 创建告警过滤器 */
export function createAlarmFilter(data: Partial<AlarmFilter>) {
  return http.post<AlarmFilter, Partial<AlarmFilter>>('/alarm-filters', data);
}

/** 更新告警过滤器 */
export function updateAlarmFilter(id: number | string, data: Partial<AlarmFilter>) {
  return http.put<AlarmFilter, Partial<AlarmFilter>>(`/alarm-filters/${id}`, data);
}

/** 获取告警过滤器详情 */
export function getAlarmFilter(id: number | string) {
  return http.get<AlarmFilter>(`/alarm-filters/${id}`);
}

/** 删除告警过滤器 */
export function deleteAlarmFilter(id: number | string) {
  return http.delete<void>(`/alarm-filters/${id}`);
}

/** 切换告警过滤器启用状态 */
export function toggleAlarmFilterEnable(id: number | string) {
  return http.put<void>(`/alarm-filters/${id}/enable`);
}

/* ============ 告警同步配置 ============ */

/** 获取告警同步配置 */
export function getAlarmSyncConfig() {
  return http.get<AlarmSyncConfig>('/alarm-sync-config');
}

/** 更新告警同步配置 */
export function updateAlarmSyncConfig(data: AlarmSyncConfig) {
  return http.put<void, AlarmSyncConfig>('/alarm-sync-config', data);
}

/* ============ 邮件通知配置 ============ */

/** 获取邮件通知配置 */
export function getEmailNotificationConfig() {
  return http.get<EmailNotificationConfig>('/email-notification/config');
}

/** 更新邮件通知配置 */
export function updateEmailNotificationConfig(data: EmailNotificationConfig) {
  return http.put<void, EmailNotificationConfig>('/email-notification/config', data);
}