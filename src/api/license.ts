/**
 * License 授权管理 API
 *
 * 对齐 nmsappsrv 后端 internal/license/routes.go
 */

import { http } from '@/utils/request';
import type { License, SASConfig, EntraEndpoint, LicenseInfo } from '@/types/license';

/* ============ License 管理 ============ */

/** 获取 License 列表 */
export function getLicenses() {
  return http.get<License[]>('/licenses');
}

/** 获取 License 详情 */
export function getLicense(id: number | string) {
  return http.get<License>(`/license/${id}`);
}

/** 更新 License */
export function updateLicense(id: number | string, data: Partial<License>) {
  return http.put<License, Partial<License>>(`/license/${id}`, data);
}

/** 获取 License 信息 */
export function getLicenseInfo() {
  return http.get<LicenseInfo>('/license/info');
}

/** 上传 License 文件 */
export function uploadLicenseFile(file: File) {
  return http.upload<License>('/license/upload', file, {
    fieldName: 'file',
  });
}

/* ============ SAS 配置 ============ */

/** 获取 SAS 配置 */
export function getSASConfig() {
  return http.get<SASConfig>('/license/sas-config');
}

/** 保存 SAS 配置 */
export function saveSASConfig(data: Partial<SASConfig>) {
  return http.put<void, Partial<SASConfig>>('/license/sas-config', data);
}

/* ============ Entra 端点 ============ */

/** 获取 Entra 端点列表 */
export function getEntraEndpoints() {
  return http.get<EntraEndpoint[]>('/license/entra-endpoints');
}

/** 创建 Entra 端点 */
export function createEntraEndpoint(data: Partial<EntraEndpoint>) {
  return http.post<EntraEndpoint, Partial<EntraEndpoint>>('/license/entra-endpoints', data);
}

/** 更新 Entra 端点 */
export function updateEntraEndpoint(id: number | string, data: Partial<EntraEndpoint>) {
  return http.put<EntraEndpoint, Partial<EntraEndpoint>>(`/license/entra-endpoints/${id}`, data);
}

/** 删除 Entra 端点 */
export function deleteEntraEndpoint(id: number | string) {
  return http.delete<void>(`/license/entra-endpoints/${id}`);
}
