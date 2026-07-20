/**
 * MR 管理类型定义
 * 对齐 nmsappsrv 后端 mr/model.go
 */

/** MR 数据实体 */
export interface MRData {
  id: number;
  elementId: number;
  cellId: string;
  ueId: string;
  amfId: string;
  eventTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  eventType: string;
  NRScArfcn: string;
  NRScPci: string;
  NRScSSRSRP: string;
  NRScSSRSRQ: string;
  NRScSSSINR: string;
  NRScTadv: string;
  NRScPHR: string;
  hAOA: string;
  vAOA: string;
  NRUEPlrUL: string;
  NRUEPlrDL: string;
  NRNcArfcn: string;
  NRNcPci: string;
  NRNcSSRSRP: string;
  NRNcSSRSRQ: string;
  NRNcSSSINR: string;
  LteNcEarfcn: string;
  LteNcPci: string;
  LteNcRSRP: string;
  LteNcRSRQ: string;
  PLMN: string;
  NRScSSBIndexId: string;
  NRNcSSBIndexId: string;
  Longitude: string;
  Latitude: string;
}

/** MR 文件上传日志 */
export interface MRFileLog {
  id: number;
  elementId: number;
  fileName: string;
  uploadTime: string;
}

/** MR 统计查询参数 */
export interface MRStatisticParams {
  elementId?: number;
  cellId?: string;
  startTime?: string;
  endTime?: string;
  eventType?: string;
  [key: string]: unknown;
}

/** MR 日志查询参数 */
export interface MRLogQueryParams {
  page?: number;
  pageSize?: number;
  elementId?: number;
  startTime?: string;
  endTime?: string;
  [key: string]: unknown;
}
