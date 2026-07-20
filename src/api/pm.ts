/**
 * PM 性能管理 API
 *
 * 对齐 nmsappsrv 后端 internal/pm/routes.go
 * - GET    /api/v1/pm/kpi              KPI 列表
 * - POST   /api/v1/pm/kpi              创建 KPI
 * - PUT    /api/v1/pm/kpi/:id          更新 KPI
 * - DELETE /api/v1/pm/kpi/:id          删除 KPI
 * - GET    /api/v1/pm/templates        PM 模板列表
 * - POST   /api/v1/pm/templates        创建 PM 模板
 * - PUT    /api/v1/pm/templates/:id    更新 PM 模板
 * - DELETE /api/v1/pm/templates/:id    删除 PM 模板
 * - GET    /api/v1/pm/file-logs        PM 文件日志列表（分页）
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
  return http.getPage<PMKpi>('/pm/kpi', params);
}

/** 创建 KPI */
export function createKpi(data: Partial<PMKpi>) {
  return http.post<PMKpi, Partial<PMKpi>>('/pm/kpi', data);
}

/** 更新 KPI */
export function updateKpi(id: number | string, data: Partial<PMKpi>) {
  return http.put<PMKpi, Partial<PMKpi>>(`/pm/kpi/${id}`, data);
}

/** 删除 KPI */
export function deleteKpi(id: number | string) {
  return http.delete<void>(`/pm/kpi/${id}`);
}

/* ============ PM 模板 ============ */

/** 获取 PM 模板列表 */
export function getTemplateList(params: PMTemplateQueryParams = {}) {
  return http.getPage<PMTemplate>('/pm/templates', params);
}

/** 创建 PM 模板 */
export function createTemplate(data: Partial<PMTemplate>) {
  return http.post<PMTemplate, Partial<PMTemplate>>('/pm/templates', data);
}

/** 更新 PM 模板 */
export function updateTemplate(id: number | string, data: Partial<PMTemplate>) {
  return http.put<PMTemplate, Partial<PMTemplate>>(`/pm/templates/${id}`, data);
}

/** 删除 PM 模板 */
export function deleteTemplate(id: number | string) {
  return http.delete<void>(`/pm/templates/${id}`);
}

/* ============ PM 文件日志 ============ */

/** 获取 PM 文件日志列表（分页） */
export function getFileLogs(params: PMFileLogQueryParams = {}) {
  return http.getPage<PMFileLog>('/pm/file-logs', params);
}
