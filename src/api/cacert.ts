import { http } from '@/utils/request';
import type {
  CaFile,
  CaFileListQuery,
  CaFileDeleteRequest,
  CaTask,
  CaTaskSaveRequest,
  CaTaskListQuery,
  CaTaskDetailQuery,
  CaTaskDeleteRequest,
  DeviceSendCaLog,
  DeviceCaLogQuery,
} from '@/types/cacert';

const BASE = '';

interface PagedResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}

// CA 文件列表
export function listCaFiles(data: CaFileListQuery) {
  return http.post<PagedResult<CaFile>>(`${BASE}/caFile/list`, data);
}

// 删除 CA 文件
export function deleteCaFile(data: CaFileDeleteRequest) {
  return http.post<void>(`${BASE}/caFile/delete`, data);
}

// 查询全部 CA 文件（用于下拉）
export function queryCaList() {
  return http.post<CaFile[]>(`${BASE}/caFile/queryCaList`, {});
}

// 上传 CA 文件（multipart/form-data）
export function uploadCaFile(files: File[], description: string) {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('description', description);
  return http.post<{ fileName: string; url: string }>(`${BASE}/caFile/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// 保存 CA 任务
export function saveCaTask(data: CaTaskSaveRequest) {
  return http.post<void>(`${BASE}/catask/save`, data);
}

// CA 任务列表
export function listCaTasks(data: CaTaskListQuery) {
  return http.post<PagedResult<CaTask>>(`${BASE}/catask/list`, data);
}

// CA 任务详情
export function getCaTaskDetail(data: CaTaskDetailQuery) {
  return http.post<unknown>(`${BASE}/catask/detail`, data);
}

// 删除 CA 任务
export function deleteCaTask(data: CaTaskDeleteRequest) {
  return http.post<void>(`${BASE}/catask/delete`, data);
}

// 查询设备的 CA 下发日志
export function queryDeviceSendCaLog(data: DeviceCaLogQuery) {
  return http.post<PagedResult<DeviceSendCaLog>>(`${BASE}/catask/queryDeviceSendCaLog`, data);
}
