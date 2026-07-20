/**
 * 租户管理类型定义
 * 对齐 nmsappsrv 后端 internal/tenancy/model.go
 */

/** 租户 VO */
export interface TenancyVO {
  id: number;
  licenseName?: string | null;
  licenseId?: string | null;
  expiryDate?: number | null;
  enbQuantity?: number | null;
  userQuantity?: number | null;
  provinceAbbreviation?: string | null;
  vendorCode?: string | null;
  omcName?: string | null;
  timezone?: string | null;
  logoBase64?: string | null;
  gnbQuantity?: number | null;
  cpeQuantity?: number | null;
}

/** 添加租户请求 */
export interface AddTenancyRequest {
  licenseName: string;
  expiryDate: number;
  enbQuantity?: number | null;
  userQuantity?: number | null;
  provinceAbbreviation?: string | null;
  vendorCode?: string | null;
  omcName?: string | null;
  timezone?: string | null;
  logoBase64?: string | null;
  gnbQuantity?: number | null;
  cpeQuantity?: number | null;
}

/** 更新租户请求 */
export interface UpdateTenancyRequest {
  id: number;
  licenseName: string;
  expiryDate: number;
  enbQuantity?: number | null;
  userQuantity?: number | null;
  provinceAbbreviation?: string | null;
  vendorCode?: string | null;
  omcName?: string | null;
  timezone?: string | null;
  logoBase64?: string | null;
  gnbQuantity?: number | null;
  cpeQuantity?: number | null;
}

/** 删除租户请求 */
export interface DeleteTenancyRequest {
  id: number;
}

/** 查看租户请求 */
export interface ViewTenancyRequest {
  id: number;
}

/** 查看租户响应 */
export interface ViewTenancyResponse {
  id: number;
  licenseName?: string | null;
  licenseId?: string | null;
  expiryDate?: number | null;
  enbQuantity?: number | null;
  userQuantity?: number | null;
  provinceAbbreviation?: string | null;
  vendorCode?: string | null;
  omcName?: string | null;
  timezone?: string | null;
  logoBase64?: string | null;
  gnbQuantity?: number | null;
  cpeQuantity?: number | null;
}
