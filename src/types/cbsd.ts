/**
 * CBSD 管理类型定义
 * 对齐 nmsappsrv 后端 internal/cbsd/model.go
 */

/** CBSD 信息实体 */
export interface CbsdInfo {
  id: number;
  elementId: number;
  cbsdId?: string | null;
  fccId?: string | null;
  serialNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  height?: number | null;
  heightType?: string | null;
  antennaGain?: number | null;
  cbsdCategory?: string | null;
  status?: string | null;
  registrationTime?: string | null;
  lastContactTime?: string | null;
}

/** CBSD 证书实体 */
export interface CbsdCertificate {
  id: number;
  elementId: number;
  fileName?: string | null;
  filePath?: string | null;
  uploadTime?: string | null;
  status?: string | null;
}

/** CBSD 信息查询参数 */
export interface CbsdInfoQueryParams {
  page?: number;
  pageSize?: number;
  elementId?: number;
  cbsdId?: string;
  status?: string;
  [key: string]: unknown;
}

/** CBSD 信息更新参数 */
export interface CbsdInfoUpdateParams {
  cbsdId?: string | null;
  fccId?: string | null;
  serialNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  height?: number | null;
  heightType?: string | null;
  antennaGain?: number | null;
  cbsdCategory?: string | null;
  status?: string | null;
}
