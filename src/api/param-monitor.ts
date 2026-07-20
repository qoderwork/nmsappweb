/**
 * 参数监控 API
 *
 * 对齐 nmsappsrv 后端 parammonitor/routes.go
 */

import { http } from '@/utils/request';
import type {
  ParameterMonitorConfig,
  MonitorConfigVo,
  ThresholdRule,
  RealtimeMonitorDataVo,
} from '@/types/param-monitor';

/* ============ 监控配置 ============ */

/** 添加监控配置 */
export function addMonitorConfig(data: Partial<ParameterMonitorConfig>) {
  return http.post<ParameterMonitorConfig, Partial<ParameterMonitorConfig>>('/param-monitor/configs', data);
}

/** 监控配置列表 */
export function getMonitorConfigs(params?: Record<string, unknown>) {
  return http.getPage<MonitorConfigVo>('/param-monitor/configs', params);
}

/** 更新监控配置 */
export function updateMonitorConfig(data: Partial<ParameterMonitorConfig>) {
  return http.put<ParameterMonitorConfig, Partial<ParameterMonitorConfig>>('/param-monitor/configs', data);
}

/** 删除监控配置 */
export function deleteMonitorConfig(data: { ids: number[] }) {
  return http.post<void, { ids: number[] }>('/param-monitor/configs/delete', data);
}

/** 查看监控配置 */
export function viewMonitorConfig(data: { id: number }) {
  return http.post<ParameterMonitorConfig, { id: number }>('/param-monitor/configs/view', data);
}

/** 切换监控配置状态 */
export function toggleMonitorConfig(data: { id: number; enabled: boolean }) {
  return http.post<void, { id: number; enabled: boolean }>('/param-monitor/configs/toggle', data);
}

/* ============ 实时监控 ============ */

/** 实时监控数据 */
export function getRealtimeMonitorData(data: { element_id: number; parameter_names: string[] }) {
  return http.post<RealtimeMonitorDataVo[], { element_id: number; parameter_names: string[] }>('/param-monitor/realtime', data);
}

/** 重新加载监控参数 */
export function reloadMonitorParams(data: { element_id: number }) {
  return http.post<void, { element_id: number }>('/param-monitor/reload', data);
}

/** 批量查询 */
export function batchQueryMonitor(data: Record<string, unknown>) {
  return http.post<Record<string, unknown>[], Record<string, unknown>>('/param-monitor/batch-query', data);
}

/** 批量实时查询 */
export function batchQueryLiveMonitor(data: Record<string, unknown>) {
  return http.post<Record<string, unknown>[], Record<string, unknown>>('/param-monitor/batch-query-live', data);
}

/* ============ 阈值规则 ============ */

/** 创建阈值规则 */
export function createThresholdRule(data: Partial<ThresholdRule>) {
  return http.post<ThresholdRule, Partial<ThresholdRule>>('/param-monitor/threshold', data);
}

/** 更新阈值规则 */
export function updateThresholdRule(id: number, data: Partial<ThresholdRule>) {
  return http.put<ThresholdRule, Partial<ThresholdRule>>(`/param-monitor/threshold/${id}`, data);
}

/** 删除阈值规则 */
export function deleteThresholdRule(id: number) {
  return http.delete<void>(`/param-monitor/threshold/${id}`);
}

/** 阈值规则列表 */
export function getThresholdRules(params?: Record<string, unknown>) {
  return http.getPage<ThresholdRule>('/param-monitor/threshold', params);
}

/** 阈值规则详情 */
export function getThresholdRuleDetail(id: number) {
  return http.get<ThresholdRule>(`/param-monitor/threshold/${id}`);
}

/** 测试阈值规则 */
export function testThresholdRule(data: Partial<ThresholdRule>) {
  return http.post<{ triggered: boolean; message?: string }, Partial<ThresholdRule>>('/param-monitor/threshold/test', data);
}
