import { http } from '@/utils/request';
import type {
  MysqlInfo,
  RedisInfo,
  QueueInfo,
  HAComponentStatus,
} from '@/types/health';

const BASE = '/api/v1';

// MySQL 健康
export function getMysqlInfo() {
  return http.get<MysqlInfo>(`${BASE}/health/mysql`);
}

// Redis 健康
export function getRedisInfo() {
  return http.get<RedisInfo>(`${BASE}/health/redis`);
}

// 队列信息
export function getQueueInfo() {
  return http.get<QueueInfo[]>(`${BASE}/health/queues`);
}

// 上报 HA 组件状态
export function reportHAStatus(data: HAComponentStatus) {
  return http.post<void>(`${BASE}/health/ha-status`, data);
}
