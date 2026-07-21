/**
 * 仪表盘 API
 *
 * 对齐 nmsappsrv 后端 dashboard/routes.go
 */

import { http } from '@/utils/request';

/* ============ 类型定义 ============ */

/** 设备在线统计信息 */
export interface DeviceOnlineInfo {
  gnbOnlineCount: number;
  gnbOfflineCount: number;
  enbOnlineCount: number;
  enbOfflineCount: number;
  cpeOnlineCount: number;
  cpeOfflineCount: number;
}

/** 产品类型与设备数量 */
export interface ProductTypeAndCount {
  productType: string;
  count: number;
  onlineCount: number;
  offlineCount: number;
}

/** PDCP 流量统计 */
export interface PDCPTrafficStatistic {
  plmn: string;
  down: number;
  up: number;
}

/** 时间序列数据点 */
export interface TimeAndDataVO {
  time: string;
  data: unknown;
}

/** 基站统计 */
export interface BaseStationStatistics {
  cellAvailableRate: Record<string, TimeAndDataVO[]>;
  pdcp: Record<string, TimeAndDataVO[]>;
}

/** KPI 统计项 */
export interface KPIStatisticItem {
  statisticTime: string;
  cellAvailRatio: number;
  macRxBytesUl: number;
  macTxBytesDl: number;
}

/** KPI 设备组 */
export interface KPIDeviceGroup {
  groupId: string;
  groupName: string;
  tenancyName: string | null;
  statisticsItem: KPIStatisticItem[];
}

/** KPI 统计响应 */
export interface KPIStatistic {
  statisticStartTime: string | null;
  statisticEndTime: string | null;
  granularity: string;
  deviceGroup: KPIDeviceGroup[];
}

/* ============ API ============ */

/** 获取设备在线信息 */
export function getDeviceOnlineInfo() {
  return http.post<DeviceOnlineInfo>('/dashboard/device-online-info', {});
}

/** 获取产品类型与设备数量 */
export function getProductTypeAndDeviceCount(mode: string = 'CPE') {
  return http.post<ProductTypeAndCount[]>('/dashboard/product-type-device-count', { mode });
}

/** 获取 CPE 在线统计 */
export function getCpeOnlineStatistics(params?: { elementIds?: number[]; startTime?: string; endTime?: string }) {
  return http.post<TimeAndDataVO[]>('/dashboard/cpe-online-stats', params || {});
}

/** 获取 GNB 在线统计 */
export function getGNBOnlineStatistics(params?: { elementIds?: number[]; startTime?: string; endTime?: string }) {
  return http.post<TimeAndDataVO[]>('/dashboard/gnb-online-stats', params || {});
}

/** 获取基站统计 */
export function getBaseStationStatistics(params: { elementIds?: number[]; startTime: string; endTime: string }) {
  return http.post<BaseStationStatistics>('/dashboard/base-station-stats', params);
}

/** 获取 PDCP 流量统计 */
export function getPDCPTrafficStatistic(params: { startTime: string; endTime: string }) {
  return http.post<PDCPTrafficStatistic[]>('/dashboard/pdcp-traffic', params);
}

/** 获取 KPI 统计 */
export function getKPIStatistic(params: { deviceGroupId: string[]; granularity: string; gmt: string; timestamp?: number }) {
  return http.post<KPIStatistic>('/dashboard/kpi-device-loop', params);
}

/** 获取 CPU 和内存使用率 */
export interface CpuMemUsage {
  cpu: number;
  mem: number;
  timestamp: string;
}

export function getCpuMemUsage() {
  return http.post<CpuMemUsage>('/cpu-mem-usage', {});
}

/* ============ 告警相关（从 alarm 模块重新导出，方便 dashboard 统一导入） ============ */
export { getSeverityCount, getAlarmStatisticTopN } from './alarm';
export type { SeverityCount } from '@/types';
