/**
 * 参数对比 API
 *
 * 对齐 nmsappsrv 后端 paramcompare/routes.go
 */

import { http } from '@/utils/request';
import type { ParamCompareResult, ParamCompareTemplate } from '@/types/param-compare';

/** 参数对比 */
export function compareParams(data: Record<string, unknown>) {
  return http.post<ParamCompareResult[], Record<string, unknown>>('/param-compare/compare', data);
}

/** 批量对比 */
export function batchCompareParams(data: Record<string, unknown>) {
  return http.post<ParamCompareResult[], Record<string, unknown>>('/param-compare/batch', data);
}

/** 对比模板列表 */
export function getCompareTemplates(params?: Record<string, unknown>) {
  return http.getPage<ParamCompareTemplate>('/param-compare/templates', params);
}
