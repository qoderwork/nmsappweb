/**
 * 站点管理类型定义
 * 对齐 nmsappsrv 后端 site/model.go
 */

/** 站点实体（对齐 SiteInfo） */
export interface SiteInfo {
  id: string;
  site_name?: string | null;
  description?: string | null;
  area_id?: number | null;
  tenant_id?: number | null;
  latitude?: string | null;
  longitude?: string | null;
  creation_time?: string | null;
}

/** 站点列表响应（包含区域路径） */
export interface SiteInfoVo extends SiteInfo {
  area_path: string;
}

/** 站点简要信息 */
export interface SiteBasicInfo {
  id: string;
  site_name?: string | null;
}

/** 区域实体（对齐 SysArea） */
export interface SysArea {
  id: number;
  p_id?: number | null;
  area_name?: string | null;
  sort?: string | null;
  level?: number | null;
  abbreviation?: string | null;
  code?: string | null;
  tenant_id?: number | null;
}

/** 系统配置 */
export interface SystemConfig {
  id: string;
  config?: string | null;
}

/** 系统参数 */
export interface SystemParameter {
  id: number;
  par_keyname?: string | null;
  par_keyvalue?: string | null;
}

/** 站点查询参数 */
export interface SiteQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: unknown;
}
