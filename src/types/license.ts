/**
 * License 授权管理类型定义
 * 对齐 nmsappsrv 后端 internal/license/model.go
 */

/** License 实体 */
export interface License {
  id: number;
  licenseName?: string | null;
  licenseId?: string | null;
  licenseType?: string | null;
  expiryDate?: number | null;
  enbQuantity?: number | null;
  roleId?: string | null;
  userQuantity?: number | null;
  acsUrl?: string | null;
  omcName?: string | null;
  provinceAbbreviation?: string | null;
  vendorCode?: string | null;
  timezone?: string | null;
  logoBase64?: string | null;
  gnbQuantity?: number | null;
  cpeQuantity?: number | null;
  subject?: string | null;
  issuer?: string | null;
  features?: string | null;
  capacity?: number | null;
  notBefore?: number | null;
  machineFingerprint?: string | null;
  status?: string | null;
  verifiedAt?: number | null;
  licenseFilePath?: string | null;
}

/** SAS 配置 */
export interface SASConfig {
  id?: number | null;
  licenseId?: string | null;
  autoRegister?: boolean | undefined;
}

/** Entra 端点 */
export interface EntraEndpoint {
  id: number;
  tenancyId?: string | null;
  clientId?: string | null;
  secretKey?: string | null;
  tenancyIdInNms?: string | null;
  endpointName?: string | null;
  nmsFqdn?: string | null;
}

/** License 信息 */
export interface LicenseInfo {
  licenseName?: string | null;
  licenseId?: string | null;
  licenseType?: string | null;
  expiryDate?: number | null;
  status?: string | null;
  enbQuantity?: number | null;
  gnbQuantity?: number | null;
  cpeQuantity?: number | null;
  userQuantity?: number | null;
}
