/**
 * CBSD 管理 API
 * 对齐 nmsappsrv 后端 internal/cbsd/routes.go
 */

import { http } from '@/utils/request';
import type {
  CbsdInfo,
  CbsdCertificate,
  CbsdInfoQueryParams,
  CbsdInfoUpdateParams,
  SasConfig,
  CbsdLog,
  SpectrumInquiryParams,
  SpectrumInquiryResponse,
  GrantParams,
  GrantResponse,
  HeartbeatParams,
  RelinquishmentParams,
  RegisterCBSDParams,
  DeregisterCBSDParams,
  CbsdLogQueryParams,
} from '@/types/cbsd';

/* ============ CBSD 信息 ============ */

export function getCbsdInfoList(params: CbsdInfoQueryParams = {}) {
  return http.getPage<CbsdInfo>('/cbsd', params);
}

export function getCbsdInfo(id: number | string) {
  return http.get<CbsdInfo>(`/cbsd/${id}`);
}

export function updateCbsdInfo(id: number | string, data: CbsdInfoUpdateParams) {
  return http.put<CbsdInfo, CbsdInfoUpdateParams>(`/cbsd/${id}`, data);
}

/* ============ CBSD 注册/注销 ============ */

export function registerCBSDs(data: RegisterCBSDParams) {
  return http.post<void>('/cbsd/register', data);
}

export function deregisterCBSDs(data: DeregisterCBSDParams) {
  return http.post<void>('/cbsd/deregister', data);
}

/* ============ CBSD 启用/禁用 ============ */

export function enableCBSD(id: number | string) {
  return http.post<void>(`/cbsd/${id}/enable`);
}

export function disableCBSD(id: number | string) {
  return http.post<void>(`/cbsd/${id}/disable`);
}

/* ============ SAS 协议 ============ */

export function spectrumInquiry(data: SpectrumInquiryParams) {
  return http.post<SpectrumInquiryResponse[]>('/cbsd/spectrum-inquiry', data);
}

export function grantCBSD(id: number | string, data: GrantParams) {
  return http.post<GrantResponse>(`/cbsd/${id}/grant`, data);
}

export function relinquishCBSD(id: number | string, data: RelinquishmentParams) {
  return http.post<void>(`/cbsd/${id}/relinquishment`, data);
}

export function sasHeartbeat(id: number | string, data: HeartbeatParams) {
  return http.post<void>(`/cbsd/${id}/sas-heartbeat`, data);
}

/* ============ CBSD 证书 ============ */

export function getCbsdCertificates() {
  return http.get<CbsdCertificate[]>('/cbsd/certificate');
}

export function uploadCbsdCertificate(file: File, elementId?: number) {
  return http.upload<CbsdCertificate>('/cbsd/certificate', file, {
    fieldName: 'file',
    extraData: elementId != null ? { elementId: String(elementId) } : undefined,
  });
}

export function deleteCbsdCertificate(id: number | string) {
  return http.delete<void>(`/cbsd/certificate/${id}`);
}

/* ============ CBSD 结果任务 ============ */

export function triggerCbsdResultTask() {
  return http.post<void>('/cbsd/result-task');
}

/* ============ SAS 配置 ============ */

export function getSasConfig() {
  return http.get<SasConfig[]>('/cbsd/sas-config');
}

export function updateSasConfig(data: Partial<SasConfig>) {
  return http.put<void, Partial<SasConfig>>('/cbsd/sas-config', data);
}

/* ============ CBSD 日志 ============ */

export function getCbsdLogs(params: CbsdLogQueryParams = {}) {
  return http.getPage<CbsdLog>('/cbsd-logs', params);
}

/* ============ CBSD 统计 ============ */

export function getCbsdStatusCount() {
  return http.post<{ status: string; count: number }[]>('/cbsd/status-count');
}

/* ============ CBSD 导入/模板 ============ */

export function importCBSDs(file: File) {
  return http.upload<void>('/cbsd/import', file);
}

export function downloadCbsdTemplate() {
  return http.download('/cbsd/template');
}
