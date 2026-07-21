import { http } from '@/utils/request';
import type {
  ResourcesVO,
  TableStatusVO,
  DiskUsageVO,
  ThresholdConfig,
} from '@/types/resources';

const BASE = '';

// 获取 CPU/内存使用率
export function getCpuAndMemUsage() {
  return http.post<ResourcesVO>(`${BASE}/cpu-mem-usage`);
}

// 获取数据库表状态
export function getTableStatus() {
  return http.get<TableStatusVO[]>(`${BASE}/table-status`);
}

// 获取磁盘使用情况
export function getDiskUsage() {
  return http.get<DiskUsageVO[]>(`${BASE}/disk-usage`);
}

// 保存 CPU/内存阈值配置
export function setCPUAndMemThreshold(data: ThresholdConfig) {
  return http.post<void>(`${BASE}/cpu-mem-threshold`, data);
}

// 查询 CPU/内存阈值配置
export function listCPUAndMemThreshold() {
  return http.post<ThresholdConfig>(`${BASE}/list-cpu-mem-threshold`);
}
