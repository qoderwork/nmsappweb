/**
 * CBSD 管理 API
 *
 * 对齐 nmsappsrv 后端 internal/cbsd/routes.go
 * - GET    /api/v1/cbsd/info              CBSD 信息列表（分页）
 * - GET    /api/v1/cbsd/info/:id          CBSD 详情
 * - PUT    /api/v1/cbsd/info/:id          更新 CBSD
 * - GET    /api/v1/cbsd/certificate       CBSD 证书列表
 * - POST   /api/v1/cbsd/certificate       上传 CBSD 证书
 * - DELETE /api/v1/cbsd/certificate/:id   删除证书
 * - POST   /api/v1/cbsd/result-task       触发 CBSD 结果任务
 */

import { http } from '@/utils/request';
import type {
  CbsdInfo,
  CbsdCertificate,
  CbsdInfoQueryParams,
  CbsdInfoUpdateParams,
} from '@/types/cbsd';

/* ============ CBSD 信息 ============ */

/** 获取 CBSD 信息列表（分页） */
export function getCbsdInfoList(params: CbsdInfoQueryParams = {}) {
  return http.getPage<CbsdInfo>('/cbsd/info', params);
}

/** 获取 CBSD 详情 */
export function getCbsdInfo(id: number | string) {
  return http.get<CbsdInfo>(`/cbsd/info/${id}`);
}

/** 更新 CBSD */
export function updateCbsdInfo(id: number | string, data: CbsdInfoUpdateParams) {
  return http.put<CbsdInfo, CbsdInfoUpdateParams>(`/cbsd/info/${id}`, data);
}

/* ============ CBSD 证书 ============ */

/** 获取 CBSD 证书列表 */
export function getCbsdCertificates() {
  return http.get<CbsdCertificate[]>('/cbsd/certificate');
}

/** 上传 CBSD 证书 */
export function uploadCbsdCertificate(file: File, elementId?: number) {
  return http.upload<CbsdCertificate>('/cbsd/certificate', file, {
    fieldName: 'file',
    extraData: elementId != null ? { elementId: String(elementId) } : undefined,
  });
}

/** 删除 CBSD 证书 */
export function deleteCbsdCertificate(id: number | string) {
  return http.delete<void>(`/cbsd/certificate/${id}`);
}

/* ============ CBSD 结果任务 ============ */

/** 触发 CBSD 结果任务 */
export function triggerCbsdResultTask() {
  return http.post<void>('/cbsd/result-task');
}
