/**
 * 站点管理 API
 *
 * 对齐 nmsappsrv 后端 site/routes.go
 * - GET    /api/v1/sites              站点列表（分页）
 * - GET    /api/v1/sites/basic        站点简要信息
 * - POST   /api/v1/sites              创建站点
 * - PUT    /api/v1/sites/:id          更新站点
 * - DELETE /api/v1/sites/:id          删除站点
 * - GET    /api/v1/system/areas       区域列表
 * - POST   /api/v1/system/areas       创建区域
 * - PUT    /api/v1/system/areas/:id   更新区域
 * - DELETE /api/v1/system/areas/:id   删除区域
 */

import { http } from '@/utils/request';
import type {
  SiteInfo,
  SiteInfoVo,
  SiteBasicInfo,
  SysArea,
  SiteQueryParams,
} from '@/types/site';

/* ============ 站点管理 ============ */

/** 获取站点列表（分页） */
export function getSites(params: SiteQueryParams = {}) {
  return http.getPage<SiteInfoVo>('/sites', params);
}

/** 获取站点简要信息 */
export function getSiteBasicInfo() {
  return http.get<SiteBasicInfo[]>('/sites/basic');
}

/** 创建站点 */
export function createSite(data: Partial<SiteInfo>) {
  return http.post<SiteInfo, Partial<SiteInfo>>('/sites', data);
}

/** 更新站点 */
export function updateSite(id: string, data: Partial<SiteInfo>) {
  return http.put<SiteInfo, Partial<SiteInfo>>(`/sites/${id}`, data);
}

/** 删除站点 */
export function deleteSite(id: string) {
  return http.delete<void>(`/sites/${id}`);
}

/* ============ 区域管理 ============ */

/** 获取区域列表 */
export function getAreas() {
  return http.get<SysArea[]>('/system/areas');
}

/** 创建区域 */
export function createArea(data: Partial<SysArea>) {
  return http.post<SysArea, Partial<SysArea>>('/system/areas', data);
}

/** 更新区域 */
export function updateArea(id: number, data: Partial<SysArea>) {
  return http.put<SysArea, Partial<SysArea>>(`/system/areas/${id}`, data);
}

/** 删除区域 */
export function deleteArea(id: number) {
  return http.delete<void>(`/system/areas/${id}`);
}
