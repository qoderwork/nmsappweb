/**
 * 系统配置 API
 *
 * 对齐 nmsappsrv 后端 systemsettings/routes.go
 */

import { http } from '@/utils/request';
import type { DeviceConfig, ACSConfig, LogConfig, NorthBoundConfig } from '@/types/system-settings';

/* ============ 设备配置 ============ */

/** 获取设备配置 */
export function getDeviceSettings() {
  return http.get<DeviceConfig>('/settings/device');
}

/** 更新设备配置 */
export function updateDeviceSettings(data: Partial<DeviceConfig>) {
  return http.put<void, Partial<DeviceConfig>>('/settings/device', data);
}

/* ============ ACS 配置 ============ */

/** 获取 ACS 配置 */
export function getACSSettings() {
  return http.get<ACSConfig>('/settings/acs');
}

/** 更新 ACS 配置 */
export function updateACSSettings(data: Partial<ACSConfig>) {
  return http.put<void, Partial<ACSConfig>>('/settings/acs', data);
}

/* ============ 日志配置 ============ */

/** 获取日志配置 */
export function getLogSettings() {
  return http.get<LogConfig>('/settings/log');
}

/** 更新日志配置 */
export function updateLogSettings(data: Partial<LogConfig>) {
  return http.put<void, Partial<LogConfig>>('/settings/log', data);
}

/* ============ 北向配置 ============ */

/** 获取北向配置 */
export function getNorthBoundConfig() {
  return http.get<NorthBoundConfig>('/settings/north-bound');
}

/** 更新北向配置 */
export function updateNorthBoundConfig(data: Partial<NorthBoundConfig>) {
  return http.put<void, Partial<NorthBoundConfig>>('/settings/north-bound', data);
}
