/**
 * BS-Backup (基站备份/恢复) API
 *
 * 后端端点（均位于 /api/v1 下）：
 * - GET    /bs-backup/info                设备配置信息列表（GET+JSON Body）
 * - POST   /bs-backup/import-config       导入配置文件（multipart）
 * - POST   /bs-backup/export-config       导出配置文件（zip 下载）
 * - POST   /bs-backup/backup-tasks        创建备份任务
 * - POST   /bs-backup/backup-tasks/cancel 取消备份任务
 * - POST   /bs-backup/restore-tasks       创建恢复任务
 * - POST   /bs-backup/restore-tasks/cancel 取消恢复任务
 * - POST   /bs-backup/tasks/start         启动任务
 * - POST   /bs-backup/tasks               任务列表
 * - POST   /bs-backup/tasks/results       任务结果列表
 * - POST   /bs-backup/download-config     下载单个配置文件
 */

import { http } from '@/utils/request';

/* ============ 类型定义 ============ */

/** 基站备份信息 VO */
export interface BaseStationBackupInfoVo {
  elementId: number;
  deviceName: string;
  serialNumber: string;
  configFile: string;
  configFileTime: string;
  hasBackup: boolean;
  latestBackupTime: string;
}

/** 导入配置文件结果 */
export interface ImportConfigFileResult {
  elementId: number;
  fileName: string;
  success: boolean;
  message: string;
}

/** 备份/恢复任务请求 */
export interface AddBSBackupTaskRequest {
  name: string;
  /** 1=立即执行, 2=等待执行, 3=定时执行 */
  executeMode: 1 | 2 | 3;
  triggerTime?: string;
  elementIds?: number[];
  executeOnAllDevice: boolean;
  scope?: string;
  deviceGroupIds?: number[];
}

/** 任务列表项 VO */
export interface BSBackupTaskVo {
  id: number;
  name: string;
  /** backup | restore */
  type: string;
  /** 1=立即, 2=等待, 3=定时 */
  executeMode: number;
  triggerTime?: string;
  status: number;
  statusText?: string;
  totalDevices?: number;
  successDevices?: number;
  failedDevices?: number;
  createTime: string;
  updateTime?: string;
  creator?: string;
}

/** 设备备份结果 VO */
export interface DeviceBackupResultVo {
  elementId: number;
  deviceName: string;
  serialNumber: string;
  result: number;
  failureReason: string;
  startTime: string;
  endTime: string;
  configurationFile: string;
}

/** 分页响应（POST 分页接口通用） */
export interface BSPageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ============ API 方法 ============ */

/** 获取基站备份信息列表（GET + JSON Body） */
export function getBSBackupInfoList(data: { searchText?: string; page: number; pageSize: number }) {
  return http.get<BSPageResponse<BaseStationBackupInfoVo>>('/bs-backup/info', {
    data,
  });
}

/** 导入配置文件（multipart: file + elementId） */
export function importBSConfigFile(file: File, elementId: number) {
  return http.upload<ImportConfigFileResult>('/bs-backup/import-config', file, {
    fieldName: 'file',
    extraData: { elementId: String(elementId) },
  });
}

/** 导出配置文件（zip 下载） */
export function exportBSConfigFile(elementIds: number[]) {
  return http.postDownload('/bs-backup/export-config', { elementIds }, {
    filename: 'bs-config-export.zip',
  });
}

/** 创建备份任务 */
export function addBSBackupTask(data: AddBSBackupTaskRequest) {
  return http.post<void>('/bs-backup/backup-tasks', data);
}

/** 取消备份任务 */
export function cancelBSBackupTask(taskId: number) {
  return http.post<void>('/bs-backup/backup-tasks/cancel', { taskId });
}

/** 创建恢复任务 */
export function addBSRestoreTask(data: AddBSBackupTaskRequest) {
  return http.post<void>('/bs-backup/restore-tasks', data);
}

/** 取消恢复任务 */
export function cancelBSRestoreTask(taskId: number) {
  return http.post<void>('/bs-backup/restore-tasks/cancel', { taskId });
}

/** 启动任务 */
export function startBSBackupTask(taskId: number) {
  return http.post<void>('/bs-backup/tasks/start', { taskId });
}

/** 获取任务列表（分页） */
export function listBSBackupTasks(data: { page: number; pageSize: number }) {
  return http.post<BSPageResponse<BSBackupTaskVo>>('/bs-backup/tasks', data);
}

/** 获取任务结果列表（分页） */
export function listBSBackupTaskResults(data: { taskId: number; page: number; pageSize: number }) {
  return http.post<BSPageResponse<DeviceBackupResultVo>>('/bs-backup/tasks/results', data);
}

/** 下载单个配置文件 */
export function downloadBSConfigFile(logId: number) {
  return http.download('/bs-backup/download-config', {
    params: { logId },
    filename: `config-${logId}.cfg`,
  });
}
