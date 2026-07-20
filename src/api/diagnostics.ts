/**
 * 诊断工具 API
 *
 * 对齐 nmsappsrv 后端 internal/diagnostics/routes.go
 * - POST   /api/v1/diagnostics/ping        Ping 诊断
 * - POST   /api/v1/diagnostics/traceroute   TraceRoute 诊断
 * - POST   /api/v1/diagnostics/download     设备文件下载
 * - POST   /api/v1/diagnostics/upload       设备文件上传
 * - GET    /api/v1/diagnostics/tasks        诊断任务列表（分页）
 * - GET    /api/v1/diagnostics/tasks/:id    诊断任务详情
 */

import { http } from '@/utils/request';
import type {
  DiagnosticsTask,
  PingRequest,
  TraceRouteRequest,
  DeviceFileDownloadRequest,
  DeviceFileUploadRequest,
  DiagnosticsTaskQueryParams,
} from '@/types/diagnostics';

/** Ping 诊断 */
export function pingDiagnose(data: PingRequest) {
  return http.post<DiagnosticsTask, PingRequest>('/diagnostics/ping', data);
}

/** TraceRoute 诊断 */
export function tracerouteDiagnose(data: TraceRouteRequest) {
  return http.post<DiagnosticsTask, TraceRouteRequest>('/diagnostics/traceroute', data);
}

/** 设备文件下载 */
export function downloadDeviceFile(data: DeviceFileDownloadRequest) {
  return http.post<DiagnosticsTask, DeviceFileDownloadRequest>('/diagnostics/download', data);
}

/** 设备文件上传 */
export function uploadDeviceFile(data: DeviceFileUploadRequest) {
  return http.post<DiagnosticsTask, DeviceFileUploadRequest>('/diagnostics/upload', data);
}

/** 获取诊断任务列表（分页） */
export function getDiagnosticsTasks(params: DiagnosticsTaskQueryParams = {}) {
  return http.getPage<DiagnosticsTask>('/diagnostics/tasks', params);
}

/** 获取诊断任务详情 */
export function getDiagnosticsTask(id: number | string) {
  return http.get<DiagnosticsTask>(`/diagnostics/tasks/${id}`);
}
