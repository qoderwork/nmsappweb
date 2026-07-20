/**
 * 参数管理 API
 *
 * 对齐 nmsappsrv 后端 parameter/routes.go
 */

import { http } from '@/utils/request';
import type {
  ParameterTemplate,
  ParameterSet,
  ParameterLog,
  ParameterBackupLog,
  BatchConfigTaskVo,
  BatchConfigDetailItem,
  ModelTreeNode,
} from '@/types/parameter';

/* ============ 设备参数 ============ */

/** 获取设备参数 */
export function getParameters(elementId: number | string) {
  return http.get<Record<string, unknown>>(`/parameters/${elementId}`);
}

/** 设置参数 */
export function setParameters(elementId: number | string, data: Record<string, unknown>) {
  return http.put<void, Record<string, unknown>>(`/parameters/${elementId}`, data);
}

/* ============ 参数日志 ============ */

/** 参数日志列表 */
export function getParameterLogs(params?: Record<string, unknown>) {
  return http.getPage<ParameterLog>('/parameter-logs', params);
}

/* ============ 参数集 ============ */

/** 参数集列表 */
export function getParameterSets(params?: Record<string, unknown>) {
  return http.getPage<ParameterSet>('/parameter-sets', params);
}

/** 创建参数集 */
export function createParameterSet(data: Partial<ParameterSet>) {
  return http.post<ParameterSet, Partial<ParameterSet>>('/parameter-sets', data);
}

/** 更新参数集 */
export function updateParameterSet(id: number, data: Partial<ParameterSet>) {
  return http.put<ParameterSet, Partial<ParameterSet>>(`/parameter-sets/${id}`, data);
}

/** 删除参数集 */
export function deleteParameterSet(id: number) {
  return http.delete<void>(`/parameter-sets/${id}`);
}

/* ============ 参数模板 ============ */

/** 参数模板列表 */
export function getParameterTemplates(params?: Record<string, unknown>) {
  return http.getPage<ParameterTemplate>('/parameter-templates', params);
}

/** 创建参数模板 */
export function createParameterTemplate(data: Partial<ParameterTemplate>) {
  return http.post<ParameterTemplate, Partial<ParameterTemplate>>('/parameter-templates', data);
}

/** 更新参数模板 */
export function updateParameterTemplate(id: number, data: Partial<ParameterTemplate>) {
  return http.put<ParameterTemplate, Partial<ParameterTemplate>>(`/parameter-templates/${id}`, data);
}

/** 获取模板详情 */
export function getParameterTemplateDetail(id: number) {
  return http.get<ParameterTemplate>(`/parameter-templates/${id}`);
}

/** 删除参数模板 */
export function deleteParameterTemplate(id: number) {
  return http.delete<void>(`/parameter-templates/${id}`);
}

/** 部署模板 */
export function deployParameterTemplate(id: number, data: { element_ids: number[] }) {
  return http.post<void, { element_ids: number[] }>(`/parameter-templates/${id}/deploy`, data);
}

/** 部署日志 */
export function getParameterTemplateDeployLogs(id: number, params?: Record<string, unknown>) {
  return http.getPage<ParameterLog>(`/parameter-templates/${id}/deploy-logs`, params);
}

/* ============ 备份日志 ============ */

/** 备份日志列表 */
export function getParameterBackupLogs(params?: Record<string, unknown>) {
  return http.getPage<ParameterBackupLog>('/parameter-backup-logs', params);
}

/** 触发备份 */
export function triggerParameterBackup(elementId: number | string) {
  return http.post<void>(`/parameter-backup/${elementId}`);
}

/* ============ 批量配置 ============ */

/** 批量参数配置 */
export function createParameterTask(data: Record<string, unknown>) {
  return http.post<void, Record<string, unknown>>('/parameter-tasks', data);
}

/** 批量配置 */
export function batchConfiguration(data: Record<string, unknown>) {
  return http.post<void, Record<string, unknown>>('/batch-configuration', data);
}

/** 批量配置列表 */
export function getBatchConfigurations(params?: Record<string, unknown>) {
  return http.getPage<BatchConfigTaskVo>('/batch-configurations', params);
}

/** 批量配置详情 */
export function getBatchConfigurationDetail(taskId: number) {
  return http.get<BatchConfigDetailItem[]>(`/batch-configurations/${taskId}/detail`);
}

/* ============ 模型树 ============ */

/** 获取模型树 */
export function getModelTree(elementId: number | string) {
  return http.get<ModelTreeNode[]>(`/model-tree/${elementId}`);
}

/** 刷新参数 */
export function refreshModelTree(elementId: number | string) {
  return http.post<void>(`/model-tree/${elementId}/refresh`);
}

/** 重新加载参数 */
export function reloadModelTree(elementId: number | string) {
  return http.post<void>(`/model-tree/${elementId}/reload`);
}
