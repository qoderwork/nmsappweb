/**
 * PM 性能管理 API
 *
 * 对齐 nmsappsrv 后端 internal/pm/routes.go
 */

import { http } from '@/utils/request';
import type {
  PMKpi,
  PMTemplate,
  PMFileLog,
  PMKpiQueryParams,
  PMTemplateQueryParams,
  PMFileLogQueryParams,
} from '@/types/pm';

/* ============ KPI 管理 ============ */

/** 获取 KPI 列表 */
export function getKpiList(params: PMKpiQueryParams = {}) {
  return http.getPage<PMKpi>('/pm/kpis', params);
}

/** 获取 KPI 详情 */
export function getKpi(id: number | string) {
  return http.get<PMKpi>(`/pm/kpis/${id}`);
}

/** 创建 KPI */
export function createKpi(data: Partial<PMKpi>) {
  return http.post<PMKpi, Partial<PMKpi>>('/pm/kpis', data);
}

/** 更新 KPI */
export function updateKpi(id: number | string, data: Partial<PMKpi>) {
  return http.put<PMKpi, Partial<PMKpi>>(`/pm/kpis/${id}`, data);
}

/** 删除 KPI */
export function deleteKpi(id: number | string) {
  return http.delete<void>(`/pm/kpis/${id}`);
}

/** 获取所有 KPI（不分页） */
export function getAllKpis() {
  return http.post<PMKpi[]>('/pm/kpis/all');
}

/** 导入 KPI */
export function importKpis(file: File) {
  return http.upload<void>('/pm/kpis/import', file);
}

/* ============ KPI 集 ============ */

/** 获取 KPI 集列表 */
export function getKpiSets() {
  return http.get<{ id: number; name: string; kpis?: string }[]>('/pm/kpi-sets');
}

/** 创建 KPI 集 */
export function createKpiSet(data: { name: string; kpis?: string }) {
  return http.post<{ id: number; name: string }, { name: string; kpis?: string }>('/pm/kpi-sets', data);
}

/** 删除 KPI 集 */
export function deleteKpiSet(id: number | string) {
  return http.delete<void>(`/pm/kpi-sets/${id}`);
}

/* ============ KPI 模板 ============ */

/** 获取 KPI 模板列表 */
export function getTemplateList(params: PMTemplateQueryParams = {}) {
  return http.getPage<PMTemplate>('/pm/kpi-templates', params);
}

/** 获取 KPI 模板详情 */
export function getTemplate(id: number | string) {
  return http.get<PMTemplate>(`/pm/kpi-templates/${id}`);
}

/** 创建 KPI 模板 */
export function createTemplate(data: Partial<PMTemplate>) {
  return http.post<PMTemplate, Partial<PMTemplate>>('/pm/kpi-templates', data);
}

/** 更新 KPI 模板 */
export function updateTemplate(id: number | string, data: Partial<PMTemplate>) {
  return http.put<PMTemplate, Partial<PMTemplate>>(`/pm/kpi-templates/${id}`, data);
}

/** 删除 KPI 模板 */
export function deleteTemplate(id: number | string) {
  return http.delete<void>(`/pm/kpi-templates/${id}`);
}

/** 下载 KPI 模板 */
export function downloadTemplate(id: number | string) {
  return http.download(`/pm/kpi-templates/${id}/download`, { filename: `kpi_template_${id}.xlsx` });
}

/* ============ KPI 告警 ============ */

/** 获取 KPI 告警列表 */
export function getKpiAlarms(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http.getPage<{ id: number; name: string; kpi_name?: string; threshold?: number; status?: boolean }>('/pm/kpi-alarms', params);
}

/** 创建 KPI 告警 */
export function createKpiAlarm(data: { name: string; kpi_name?: string; threshold?: number }) {
  return http.post<{ id: number }, { name: string; kpi_name?: string; threshold?: number }>('/pm/kpi-alarms', data);
}

/** 更新 KPI 告警 */
export function updateKpiAlarm(id: number | string, data: { name?: string; kpi_name?: string; threshold?: number }) {
  return http.put<void, { name?: string; kpi_name?: string; threshold?: number }>(`/pm/kpi-alarms/${id}`, data);
}

/** 删除 KPI 告警 */
export function deleteKpiAlarm(id: number | string) {
  return http.delete<void>(`/pm/kpi-alarms/${id}`);
}

/** 更新 KPI 告警状态 */
export function updateKpiAlarmStatus(id: number | string, status: boolean) {
  return http.put<void>(`/pm/kpi-alarms/${id}/status`, { status });
}

/* ============ PM 文件日志 ============ */

/** 获取 PM 文件日志列表（分页） */
export function getFileLogs(params: PMFileLogQueryParams = {}) {
  return http.getPage<PMFileLog>('/pm/file-logs', params);
}

/** 下载 PM 文件（按设备 ID + 可选时间范围） */
export function downloadPMFile(params: {
  elementId: number | string;
  startTime?: string;
  endTime?: string;
}) {
  return http.get<Blob>('/pm/file-logs/download', {
    params,
    responseType: 'blob',
  } as any);
}

/* ============ PM 仪表盘数据 ============ */

/** 获取 PM 仪表盘数据 */
export function getDashboardData(params?: { startTime?: string; endTime?: string }) {
  return http.get<{
    totalKpis: number;
    totalTemplates: number;
    totalAlarms: number;
    recentData?: unknown[];
  }>('/pm/dashboard', { params });
}

/** 获取 PDCP 流量数据 */
export function getPDCPTraffic(params?: { startTime?: string; endTime?: string }) {
  return http.get<unknown[]>('/pm/pdcp-traffic', { params });
}

/** 获取设备在线信息 */
export function getDeviceOnlineInfo() {
  return http.get<{ online: number; offline: number; total: number }>('/pm/device-online-info');
}

/** 获取产品类型设备统计 */
export function getProductTypeDeviceCount() {
  return http.get<{ productType: string; count: number }[]>('/pm/product-type-device-count');
}

/** 导出 PM Excel */
export function exportPMExcel(params?: { startTime?: string; endTime?: string; elementIds?: number[] }) {
  return http.download('/pm/export-excel', { params });
}

/* ============ PM 补录任务 ============ */

/** 添加补录任务 */
export function addReplenishTask(data: { elementIds: number[]; startTime: string; endTime: string }) {
  return http.post<{ taskId: number }, { elementIds: number[]; startTime: string; endTime: string }>('/pm/replenish-tasks', data);
}

/** 获取补录任务列表 */
export function getReplenishTasks(params?: { page?: number; pageSize?: number }) {
  return http.post<{ list: { id: number; status: string; createTime: string }[]; total: number }>('/pm/replenish-tasks/list', params);
}

/** 查看补录任务详情 */
export function viewReplenishTask(taskId: number) {
  return http.post<{ id: number; status: string; result?: string }>('/pm/replenish-tasks/view', { taskId });
}

/** 获取补录任务设备列表 */
export function getReplenishTaskDevices(taskId: number) {
  return http.post<{ elementId: number; elementName: string; status: string }[]>('/pm/replenish-tasks/devices', { taskId });
}

/* ============ KPI 测量任务 ============ */

/** 获取 KPI 测量任务列表 */
export function getKpiMeasList(params?: { page?: number; pageSize?: number }) {
  return http.post<{ list: unknown[]; total: number }>('/pm/kpi-meas', params);
}

/** 更新测量任务开关 */
export function updateMeasTaskSwitch(taskId: number, enabled: boolean) {
  return http.post<void>('/pm/kpi-meas/switch', { taskId, enabled });
}
