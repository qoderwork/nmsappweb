/**
 * 设备相关 API
 *
 * 对齐 nmsappsrv 后端：
 * - GET    /api/v1/devices           设备列表（分页）
 * - GET    /api/v1/devices/:id       设备详情
 * - POST   /api/v1/devices           创建设备
 * - PUT    /api/v1/devices/:id       更新设备
 * - DELETE /api/v1/devices/:id       删除设备
 * - POST   /api/v1/devices/import    批量导入
 * - POST   /api/v1/devices/:id/empty-commands  清空命令队列
 * - GET    /api/v1/device-groups     设备分组列表
 * - POST   /api/v1/device-groups     创建分组
 * - PUT    /api/v1/device-groups/:id 更新分组
 * - DELETE /api/v1/device-groups/:id 删除分组
 */

import { http } from '@/utils/request';
import type {
  Device,
  DeviceGroup,
  DeviceQueryParams,
  DeviceImportResult,
} from '@/types/device';

/* ============ 设备管理 ============ */

/** 获取设备列表（分页） */
export function getDevices(params: DeviceQueryParams = {}) {
  return http.getPage<Device>('/devices', params);
}

/** 获取设备详情 */
export function getDevice(id: number | string) {
  return http.get<Device>(`/devices/${id}`);
}

/** 创建设备 */
export function createDevice(data: Partial<Device>) {
  return http.post<Device, Partial<Device>>('/devices', data);
}

/** 更新设备 */
export function updateDevice(id: number | string, data: Partial<Device>) {
  return http.put<Device, Partial<Device>>(`/devices/${id}`, data);
}

/** 删除设备 */
export function deleteDevice(id: number | string) {
  return http.delete<void>(`/devices/${id}`);
}

/** 批量导入设备 */
export function importDevices(
  file: File,
  options?: { deviceGroupId?: string; deviceType?: string }
) {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.deviceGroupId) {
    formData.append('deviceGroupId', options.deviceGroupId);
  }
  if (options?.deviceType) {
    formData.append('deviceType', options.deviceType);
  }
  return http.upload<DeviceImportResult>('/devices/import', file, {
    fieldName: 'file',
    extraData: options,
  });
}

/** 清空设备命令队列 */
export function emptyDeviceCommands(id: number | string) {
  return http.post<{ cleared: number }>(`/devices/${id}/empty-commands`);
}

/* ============ 设备分组 ============ */

/** 获取设备分组列表 */
export function getDeviceGroups() {
  return http.get<DeviceGroup[]>('/device-groups');
}

/** 创建设备分组 */
export function createDeviceGroup(data: Partial<DeviceGroup>) {
  return http.post<DeviceGroup, Partial<DeviceGroup>>('/device-groups', data);
}

/** 更新设备分组 */
export function updateDeviceGroup(id: string, data: Partial<DeviceGroup>) {
  return http.put<DeviceGroup, Partial<DeviceGroup>>(`/device-groups/${id}`, data);
}

/** 删除设备分组 */
export function deleteDeviceGroup(id: string) {
  return http.delete<void>(`/device-groups/${id}`);
}