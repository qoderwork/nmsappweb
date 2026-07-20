import { http } from '@/utils/request';
import type {
  NMSBackupTask,
  NMSBackupLog,
  BackupRetentionConfig,
  AddNMSBackupTaskRequest,
  ModifyNMSBackupTaskRequest,
  RunNMSBackupTaskRequest,
  DeleteNMSBackupTaskRequest,
  RevertNMSBackupTaskRequest,
  GetNMSBackupLogDetailRequest,
} from '@/types/backup';

export function addNMSBackupTask(data: AddNMSBackupTaskRequest) {
  return http.post<NMSBackupTask>('/nms-backup/tasks', data);
}

export function listNMSBackupTask(data: { page: number; pageSize: number }) {
  return http.post<{ list: NMSBackupTask[]; total: number; page: number; pageSize: number }>('/nms-backup/tasks/list', data);
}

export function modifyNMSBackupTask(data: ModifyNMSBackupTaskRequest) {
  return http.post('/nms-backup/tasks/modify', data);
}

export function runNMSBackupTask(data: RunNMSBackupTaskRequest) {
  return http.post('/nms-backup/tasks/run', data);
}

export function deleteNMSBackupTask(data: DeleteNMSBackupTaskRequest) {
  return http.post('/nms-backup/tasks/delete', data);
}

export function revertNMSBackupTask(data: RevertNMSBackupTaskRequest) {
  return http.post('/nms-backup/tasks/revert', data);
}

export function getBackupAndRestoreConfig() {
  return http.get<BackupRetentionConfig>('/nms-backup/config');
}

export function updateBackupAndRestoreConfig(data: { backupFileSavedDays?: number }) {
  return http.put('/nms-backup/config', data);
}

export function listNMSBackupLogs(data: { page: number; pageSize: number }) {
  return http.post<{ list: NMSBackupLog[]; total: number; page: number; pageSize: number }>('/nms-backup/logs', data);
}

export function getNMSBackupLogDetail(data: GetNMSBackupLogDetailRequest) {
  return http.post<NMSBackupLog>('/nms-backup/logs/detail', data);
}