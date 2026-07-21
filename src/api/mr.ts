/**
 * MR 管理 API
 *
 * 对齐 nmsappsrv 后端 mr/routes.go
 */

import { http } from '@/utils/request';
import type {
  MRData,
  MRFileLog,
  MRStatisticParams,
  MRLogQueryParams,
} from '@/types/mr';

/** 获取 MR 统计数据 */
export function getMRStatisticData(params: MRStatisticParams) {
  return http.post<MRData[]>('/getMRStatisticDataForData', params);
}

/** 生成 MR CSV */
export function generateMRCSV(params: MRStatisticParams) {
  return http.post<void>('/generateMRCSVForNR', params);
}

/** 下载 MR 报告 Excel */
export function downloadMRReportExcel(params?: { startTime?: string; endTime?: string }) {
  return http.download('/downloadMRReportExcel', { params });
}

/** 获取 MR 日志列表 */
export function getMRLogs(params: MRLogQueryParams = {}) {
  return http.post<{ list: MRFileLog[]; total: number; page: number; pageSize: number }>('/listMRLogs', params);
}

/** 下载 MR 原始文件 */
export function downloadMRFile(params?: { fileName?: string; elementId?: number }) {
  return http.download('/downloadMRFile', { params });
}
