/**
 * 升级管理 API
 *
 * 对齐 nmsappsrv 后端 upgrade/routes.go
 */

import { http } from '@/utils/request';
import type {
  UpgradeTask,
  UpgradeTaskVo,
  UpgradeFile,
  UpgradeLog,
  RollbackTask,
  UpgradeResultVo,
  StatusCountItem,
  DeviceResultCountItem,
  UpgradeTaskQueryParams,
} from '@/types/upgrade';

/* ============ 升级任务 ============ */

/** 获取升级任务列表 */
export function getUpgradeTasks(params: UpgradeTaskQueryParams = {}) {
  return http.getPage<UpgradeTaskVo>('/upgrade-tasks', params);
}

/** 获取升级任务详情 */
export function getUpgradeTask(id: number) {
  return http.get<UpgradeTask>(`/upgrade-tasks/${id}`);
}

/** 创建升级任务 */
export function createUpgradeTask(data: Partial<UpgradeTask>) {
  return http.post<UpgradeTask, Partial<UpgradeTask>>('/upgrade-tasks', data);
}

/** 启动升级任务 */
export function startUpgradeTask(id: number) {
  return http.post<void>(`/upgrade-tasks/${id}/start`);
}

/** 取消升级任务 */
export function cancelUpgradeTask(id: number) {
  return http.post<void>(`/upgrade-tasks/${id}/cancel`);
}

/** 获取升级任务结果列表 */
export function getUpgradeResults(id: number) {
  return http.get<UpgradeResultVo[]>(`/upgrade-tasks/${id}/results`);
}

/** 获取升级任务结果详情 */
export function getUpgradeResultDetail(id: number) {
  return http.get<UpgradeResultVo[]>(`/upgrade-tasks/${id}/results/detail`);
}

/** 获取升级任务状态统计 */
export function getUpgradeTaskStatusCount(params?: { startTime?: string; endTime?: string }) {
  return http.post<StatusCountItem[]>('/upgrade-tasks/status-count', params);
}

/** 获取升级设备结果统计 */
export function getUpgradeDeviceResultCount(params?: { taskId?: number }) {
  return http.post<DeviceResultCountItem[]>('/upgrade-tasks/device-result-count', params);
}

/* ============ 升级文件 ============ */

/** 获取升级文件列表 */
export function getUpgradeFiles() {
  return http.get<UpgradeFile[]>('/upgrade-files');
}

/** 上传升级文件 */
export function uploadUpgradeFile(file: File, data?: Record<string, string>) {
  return http.upload<UpgradeFile>('/upgrade-files', file, { extraData: data });
}

/** 删除升级文件 */
export function deleteUpgradeFile(id: number) {
  return http.delete<void>(`/upgrade-files/${id}`);
}

/** 下载升级文件 */
export function downloadUpgradeFile(id: number) {
  return http.download(`/upgrade-files/${id}/download`, { filename: 'upgrade_file' });
}

/* ============ 升级日志 ============ */

/** 获取升级日志列表 */
export function getUpgradeLogs(params?: { page?: number; pageSize?: number; taskId?: number }) {
  return http.getPage<UpgradeLog>('/upgrade-logs', params ?? {});
}

/* ============ 回滚任务 ============ */

/** 获取回滚任务列表 */
export function getRollbackTasks(params?: { page?: number; pageSize?: number }) {
  return http.getPage<RollbackTask>('/rollback-tasks', params ?? {});
}

/** 创建回滚任务 */
export function createRollbackTask(data: Partial<RollbackTask>) {
  return http.post<RollbackTask, Partial<RollbackTask>>('/rollback-tasks', data);
}

/** 启动回滚任务 */
export function startRollbackTask(id: number) {
  return http.post<void>(`/rollback-tasks/${id}/start`);
}

/** 取消回滚任务 */
export function cancelRollbackTask(id: number) {
  return http.post<void>(`/rollback-tasks/${id}/cancel`);
}

/** 获取回滚任务结果 */
export function getRollbackResults(id: number) {
  return http.get<UpgradeResultVo[]>(`/rollback-tasks/${id}/results`);
}

/* ============ 手动确认升级 ============ */

/** 手动确认升级 */
export function manualConfirmationUpgrade(data: { taskId: number; elementIds: number[] }) {
  return http.post<void>('/upgrade/manual-confirmation', data);
}
