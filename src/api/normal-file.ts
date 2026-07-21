/**
 * 普通文件管理 API
 *
 * 后端端点（均位于 /api/v1 下）：
 * - POST /mnormal-file/init-upload        初始化分片上传
 * - POST /mnormal-file/upload-chunk       上传分片（multipart）
 * - POST /mnormal-file/check-chunk        检查分片是否已上传
 * - POST /mnormal-file/assemble           合并分片
 * - POST /mnormal-file/upload             普通上传（单文件）
 * - POST /mnormal-file/delete             删除文件
 * - POST /mnormal-file/list               文件列表（分页）
 * - POST /mnormal-file/detail             文件详情
 * - POST /mnormal-file/download-to-device 下发文件到设备
 * - POST /mnormal-file/download-results   下发结果查询
 */

import { http } from '@/utils/request';

/* ============ 类型定义 ============ */

/** 普通文件记录 */
export interface MNormalFile {
  id: number;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileMd5: string;
  chunkCount: number;
  /** 上传状态：0=上传中, 1=已完成, 2=失败 */
  status: number;
  licenseId: string;
  createTime: string;
  updateTime: string;
  username: string;
  originalName: string;
}

/** 文件下发日志 */
export interface MNormalFileDownloadLog {
  id: number;
  fileId: string;
  elementId: number;
  serialNumber: string;
  commandTrackId: string;
  /** 下发状态 */
  status: number;
  faultInfo: string;
  createTime: string;
  updateTime: string;
}

/** 初始化分片上传响应 */
export interface InitUploadResponse {
  fileId: string;
}

/** 检查分片响应 */
export interface CheckChunkResponse {
  uploaded: boolean;
}

/** 普通上传响应 */
export interface UploadResponse {
  fileId: string;
}

/** 分页响应 */
export interface NormalFilePageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ============ API 方法 ============ */

/** 初始化分片上传 */
export function initFileUpload(data: { fileName: string; fileSize: number; chunkCount: number; fileMd5?: string }) {
  return http.post<InitUploadResponse>('/mnormal-file/init-upload', data);
}

/** 上传分片（multipart: fileId + chunkIndex + chunkMd5? + file） */
export function uploadFileChunk(file: File | Blob, fileId: string, chunkIndex: number, chunkMd5?: string) {
  const extraData: Record<string, string> = {
    fileId,
    chunkIndex: String(chunkIndex),
  };
  if (chunkMd5) {
    extraData.chunkMd5 = chunkMd5;
  }
  return http.upload<void>('/mnormal-file/upload-chunk', file, {
    fieldName: 'file',
    extraData,
  });
}

/** 检查分片是否已上传 */
export function checkFileChunk(data: { fileId: string; chunkIndex: number }) {
  return http.post<CheckChunkResponse>('/mnormal-file/check-chunk', data);
}

/** 合并分片 */
export function assembleFile(data: { fileId: string }) {
  return http.post<void>('/mnormal-file/assemble', data);
}

/** 普通上传（单文件） */
export function uploadNormalFile(file: File) {
  return http.upload<UploadResponse>('/mnormal-file/upload', file, {
    fieldName: 'file',
  });
}

/** 删除文件 */
export function deleteNormalFile(data: { fileId: string }) {
  return http.post<void>('/mnormal-file/delete', data);
}

/** 文件列表（分页） */
export function listNormalFiles(data: { fileName?: string; page: number; pageSize: number }) {
  return http.post<NormalFilePageResponse<MNormalFile>>('/mnormal-file/list', data);
}

/** 文件详情 */
export function getNormalFileDetail(data: { fileId: string }) {
  return http.post<MNormalFile>('/mnormal-file/detail', data);
}

/** 下发文件到设备 */
export function downloadFileToDevice(data: { fileId: string; elementIds: number[] }) {
  return http.post<void>('/mnormal-file/download-to-device', data);
}

/** 查询文件下发结果（分页） */
export function listDownloadResults(data: { fileId?: string; page: number; pageSize: number }) {
  return http.post<NormalFilePageResponse<MNormalFileDownloadLog>>('/mnormal-file/download-results', data);
}
