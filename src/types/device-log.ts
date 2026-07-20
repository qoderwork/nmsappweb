/**
 * 设备日志类型定义
 * 对齐 nmsappsrv 后端 devicelog/model.go
 */

/** 日志采集结果 VO */
export interface LogCollectionResultVo {
  id: number;
  elementId: number;
  deviceName: string;
  serialNumber: string;
  fileName: string;
  fileSize: number;
  collectionTime: string;
  status: number;
  failureReason: string;
}

/** 日志文件 VO */
export interface LogFileVo {
  id: number;
  fileName: string;
  fileSize: number;
  collectionTime: string;
}

/** 添加日志采集请求 */
export interface AddLogCollectionRequest {
  elementIds: number[];
  logType?: string;
}

/** 日志采集结果查询请求 */
export interface ListLogCollectionResultRequest {
  elementId?: number;
  deviceType?: string;
  status?: number;
  page?: number;
  pageSize?: number;
}

/** 删除全部日志文件请求 */
export interface DeleteAllLogFileRequest {
  elementId: number;
}

/** 删除日志文件请求 */
export interface DeleteLogFileRequest {
  logId: number;
}

/** 日志文件列表请求 */
export interface ListLogFileRequest {
  elementId: number;
  page?: number;
  pageSize?: number;
}

/** 启用周期性上传请求 */
export interface EnablePeriodicUploadRequest {
  elementId: number;
  interval?: number;
}

/** 禁用周期性上传请求 */
export interface DisablePeriodicUploadRequest {
  elementId: number;
}
