/**
 * 诊断工具类型定义
 * 对齐 nmsappsrv 后端 internal/diagnostics/model.go
 */

/** 诊断任务类型 */
export type DiagnosticsTaskType = 'ping' | 'traceroute' | 'download' | 'upload';

/** 诊断任务状态 */
export type DiagnosticsTaskStatus = 'pending' | 'running' | 'success' | 'failed' | 'timeout';

/** 诊断任务实体 */
export interface DiagnosticsTask {
  id: number;
  elementId: number;
  taskType: DiagnosticsTaskType;
  status?: DiagnosticsTaskStatus | null;
  result?: string | null;
  command?: string | null;
  createTime?: string | null;
  endTime?: string | null;
}

/** Ping 诊断请求 */
export interface PingRequest {
  elementId: number;
  target?: string;
  count?: number;
  timeout?: number;
}

/** TraceRoute 诊断请求 */
export interface TraceRouteRequest {
  elementId: number;
  target: string;
  maxHops?: number;
  timeout?: number;
}

/** 设备文件下载请求 */
export interface DeviceFileDownloadRequest {
  elementId: number;
  filePath: string;
}

/** 设备文件上传请求 */
export interface DeviceFileUploadRequest {
  elementId: number;
  remotePath: string;
}

/** 诊断任务查询参数 */
export interface DiagnosticsTaskQueryParams {
  page?: number;
  pageSize?: number;
  elementId?: number;
  taskType?: DiagnosticsTaskType;
  status?: DiagnosticsTaskStatus;
  [key: string]: unknown;
}
