import { http } from '@/utils/request';
import type { DeviceAuthConfig, DeviceAuthInfo, DeviceAuthInfoQuery } from '@/types/deviceauth';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

export function getDeviceAuthConfig() {
  return http.get<DeviceAuthConfig>('/device-auth/config');
}

export function saveDeviceAuthConfig(data: DeviceAuthConfig) {
  return http.put<void>('/device-auth/config', data);
}

export function getDeviceAuthInfo(query: DeviceAuthInfoQuery) {
  return http.get<PagedResult<DeviceAuthInfo>>('/device-auth/info', { params: query });
}
