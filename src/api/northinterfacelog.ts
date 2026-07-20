import { http } from '@/utils/request';
import type { NorthInterfaceLog, NorthInterfaceLogQuery } from '@/types/northinterfacelog';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

export function listNorthInterfaceLogs(query: NorthInterfaceLogQuery) {
  return http.post<PagedResult<NorthInterfaceLog>>('/north-interface-logs', query);
}
