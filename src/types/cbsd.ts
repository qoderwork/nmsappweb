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

/** SAS 配置实体 */
export interface SasConfig {
  id?: number;
  sasUrl?: string | null;
  userId?: string | null;
  fccId?: string | null;
  cpiId?: string | null;
  cpiName?: string | null;
  enabled?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** CBSD 日志实体 */
export interface CbsdLog {
  id: number;
  elementId: number;
  operation?: string | null;
  result?: string | null;
  detail?: string | null;
  createTime?: string | null;
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

/** SAS 频谱查询参数 */
export interface SpectrumInquiryParams {
  elementIds: number[];
}

/** SAS 频谱查询响应 */
export interface SpectrumInquiryResponse {
  elementId: number;
  cbsdId?: string;
  availableChannels?: Array<{
    frequencyRange: { lowFrequency: number; highFrequency: number };
    maxEirp?: number;
  }>;
  responseCode?: number;
  responseMessage?: string;
}

/** SAS Grant 参数 */
export interface GrantParams {
  elementId: number;
  frequencyRange?: { lowFrequency: number; highFrequency: number };
  maxEirp?: number;
}

/** SAS Grant 响应 */
export interface GrantResponse {
  elementId: number;
  grantId?: string;
  grantExpireTime?: string;
  heartbeatDuration?: number;
  responseCode?: number;
  responseMessage?: string;
}

/** SAS 心跳参数 */
export interface HeartbeatParams {
  elementId: number;
}

/** SAS 放弃参数 */
export interface RelinquishmentParams {
  elementId: number;
}

/** CBSD 注册参数 */
export interface RegisterCBSDParams {
  elementIds: number[];
}

/** CBSD 注销参数 */
export interface DeregisterCBSDParams {
  elementIds: number[];
}

/** CBSD 日志查询参数 */
export interface CbsdLogQueryParams {
  page?: number;
  pageSize?: number;
  elementId?: number;
  operation?: string;
  [key: string]: unknown;
}
