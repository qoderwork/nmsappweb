/**
 * 杂项 API (ZTP/批量/北向/TBG/批量添加对象等)
 */
import { http } from '@/utils/request';

/* ============ 批量添加对象 ============ */

export interface BatchAddObjectRequest {
  ids: number[];
  type: string;
  amfNumber?: number;
  sliceNumber?: number;
  taNumber?: number;
  plmnNumber?: number;
}

export interface BatchAddObjectTask {
  id: number;
  name: string;
  status: number;
  user: string;
  operationTime: string;
  progress: string;
}

export interface BatchAddObjectTaskDetail {
  id: number;
  name: string;
  status: number;
  results: Array<{
    elementId: number;
    deviceName: string;
    serialNumber: string;
    status: number;
    results: number;
    failureReason: string;
  }>;
}

export function batchAddObject(data: BatchAddObjectRequest) {
  return http.post<{ taskId: number }>('/batch-add-object', data);
}

export function listBatchAddObjectTasks(params: { page: number; pageSize: number }) {
  return http.get<{ list: BatchAddObjectTask[]; total: number; page: number; pageSize: number }>('/batch-add-object/tasks', { params });
}

export function getBatchAddObjectTaskDetail(taskId: string) {
  return http.get<BatchAddObjectTaskDetail>(`/batch-add-object/tasks/${taskId}/detail`);
}
