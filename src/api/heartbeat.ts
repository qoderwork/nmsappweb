import { http } from '@/utils/request';
import type { HeartbeatStatus, HeartbeatQuery } from '@/types/heartbeat';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

export function processHeartbeat(data: Record<string, unknown>) {
  return http.post<void>('/heartbeat/process', data);
}

export function listHeartbeatStatus(query: HeartbeatQuery) {
  return http.get<PagedResult<HeartbeatStatus>>('/heartbeat/status', { params: query });
}

export function sendHeartbeat(sn: string) {
  return http.post<void>(`/heartbeat/send/${sn}`);
}
