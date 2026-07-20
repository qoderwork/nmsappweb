import { http } from '@/utils/request';
import type {
  ListDeviceBlackListVO,
  BlackListOperationLogVO,
  ListBlackListQuery,
  AddDeviceToBlackListRequest,
  BatchDeleteRequest,
  ListBlackListOperationLogQuery,
} from '@/types/blacklist';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

export function listDeviceBlackList(query: ListBlackListQuery) {
  return http.post<PagedResult<ListDeviceBlackListVO>>('/blacklist/list', query);
}

export function addDeviceToBlackList(data: AddDeviceToBlackListRequest) {
  return http.post<void>('/blacklist/add', data);
}

export function deleteDeviceFromBlackList(id: number) {
  return http.post<void>('/blacklist/delete', { id });
}

export function batchDeleteDeviceFromBlackList(data: BatchDeleteRequest) {
  return http.post<void>('/blacklist/batch-delete', data);
}

export function listBlackListOperationLog(query: ListBlackListOperationLogQuery) {
  return http.post<PagedResult<BlackListOperationLogVO>>('/blacklist/operation-logs', query);
}
