import { http } from '@/utils/request';
import type {
  AddRebootTaskRequest,
  ListRebootTaskQuery,
  RebootTaskVO,
  RebootTaskResultVO,
  AddResetTaskRequest,
  ListResetTaskQuery,
  ResetTaskVO,
  ResetTaskResultVO,
  AddShutdownTaskRequest,
  ListShutdownTaskRequest,
  ShutdownTaskVo,
  ViewShutdownTaskRequest,
  ViewShutdownTaskVo,
  ListShutdownResultRequest,
  ShutdownResultVo,
  DeleteShutdownTaskRequest,
} from '@/types/device-ops';

const BASE = '/api/v1';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

// ---------- Reboot ----------
export function addRebootTask(data: AddRebootTaskRequest) {
  return http.post<{ id: number }>(`${BASE}/reboot-tasks`, data);
}

export function listRebootTasks(query: ListRebootTaskQuery) {
  return http.get<PagedResult<RebootTaskVO>>(`${BASE}/reboot-tasks`, { params: query });
}

export function deleteRebootTask(id: number) {
  return http.delete<void>(`${BASE}/reboot-tasks/${id}`);
}

export function startRebootTask(id: number) {
  return http.post<void>(`${BASE}/reboot-tasks/${id}/start`);
}

export function cancelRebootTask(id: number) {
  return http.post<void>(`${BASE}/reboot-tasks/${id}/cancel`);
}

export function listRebootTaskResults(id: number, params: { serialNumber?: string; page: number; pageSize: number }) {
  return http.get<PagedResult<RebootTaskResultVO>>(`${BASE}/reboot-tasks/${id}/results`, { params });
}

// ---------- Reset ----------
export function addResetTask(data: AddResetTaskRequest) {
  return http.post<{ id: number }>(`${BASE}/reset-tasks`, data);
}

export function listResetTasks(query: ListResetTaskQuery) {
  return http.get<PagedResult<ResetTaskVO>>(`${BASE}/reset-tasks`, { params: query });
}

export function deleteResetTask(id: number) {
  return http.delete<void>(`${BASE}/reset-tasks/${id}`);
}

export function startResetTask(id: number) {
  return http.post<void>(`${BASE}/reset-tasks/${id}/start`);
}

export function cancelResetTask(id: number) {
  return http.post<void>(`${BASE}/reset-tasks/${id}/cancel`);
}

export function listResetTaskResults(id: number, params: { serialNumber?: string; page: number; pageSize: number }) {
  return http.get<PagedResult<ResetTaskResultVO>>(`${BASE}/reset-tasks/${id}/results`, { params });
}

// ---------- Shutdown (note: GET/DELETE use JSON body) ----------
export function addShutdownTask(data: AddShutdownTaskRequest) {
  return http.post<{ taskId: number }>(`${BASE}/shutdown-tasks`, data);
}

export function listShutdownTasks(data: ListShutdownTaskRequest) {
  return http.get<PagedResult<ShutdownTaskVo>>(`${BASE}/shutdown-tasks`, { data });
}

export function viewShutdownTask(id: number, data: ViewShutdownTaskRequest) {
  return http.get<ViewShutdownTaskVo>(`${BASE}/shutdown-tasks/${id}`, { data });
}

export function deleteShutdownTask(id: number, data: DeleteShutdownTaskRequest) {
  return http.delete<void>(`${BASE}/shutdown-tasks/${id}`, { data });
}

export function listShutdownResults(id: number, data: ListShutdownResultRequest) {
  return http.get<PagedResult<ShutdownResultVo>>(`${BASE}/shutdown-tasks/${id}/results`, { data });
}
