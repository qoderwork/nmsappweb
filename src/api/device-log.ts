/**
 * 设备日志 API
 * 对齐 nmsappsrv 后端 devicelog/routes.go
 */

import { http } from '@/utils/request';
import type {
  LogCollectionResultVo,
  LogFileVo,
  AddLogCollectionRequest,
  ListLogCollectionResultRequest,
  DeleteAllLogFileRequest,
  DeleteLogFileRequest,
  ListLogFileRequest,
  EnablePeriodicUploadRequest,
  DisablePeriodicUploadRequest,
} from '@/types/device-log';

/** 添加日志采集任务 */
export function addLogCollectionTask(data: AddLogCollectionRequest) {
  return http.post<void>('/device-log/collection', data);
}

/** 获取日志采集结果列表 */
export function listLogCollectionResults(params: ListLogCollectionResultRequest) {
  return http.post<LogCollectionResultVo[]>('/device-log/collection/results', params);
}

/** 删除全部日志文件 */
export function deleteAllLogFile(data: DeleteAllLogFileRequest) {
  return http.post<void>('/device-log/delete-all', data);
}

/** 删除日志文件 */
export function deleteLogFile(data: DeleteLogFileRequest) {
  return http.post<void>('/device-log/delete', data);
}

/** 下载日志文件 */
export function downloadLogFile(data: { logId: number }) {
  return http.postDownload('/device-log/download', data);
}

/** 获取日志文件列表 */
export function listLogFiles(params: ListLogFileRequest) {
  return http.post<LogFileVo[]>('/device-log/files', params);
}

/** 启用周期性上传 */
export function enablePeriodicUpload(data: EnablePeriodicUploadRequest) {
  return http.post<void>('/device-log/periodic/enable', data);
}

/** 禁用周期性上传 */
export function disablePeriodicUpload(data: DisablePeriodicUploadRequest) {
  return http.post<void>('/device-log/periodic/disable', data);
}
