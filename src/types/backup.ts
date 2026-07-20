export interface NMSBackupTask {
  id: number;
  backupName: string;
  backupType: number;
  backupInterval: number;
  backupBeginTime: string;
  backupStatus: number;
  pmInterval: number;
  mrInterval: number;
  xlogInterval: number;
  createTime: string;
}

export interface NMSBackupLog {
  id: number;
  fileName: string;
  time: string;
  operationUser: string;
  result: number;
  reason: string;
}

export interface BackupRetentionConfig {
  backupFileSavedDays: number;
}

export interface AddNMSBackupTaskRequest {
  backupName: string;
  backupType: number;
  backupInterval?: number;
  backupBeginTime?: string;
  pmInterval?: number;
  mrInterval?: number;
  xlogInterval?: number;
}

export interface ModifyNMSBackupTaskRequest {
  id: number;
  backupName?: string;
  backupType?: number;
  backupInterval?: number;
  backupBeginTime?: string;
  pmInterval?: number;
  mrInterval?: number;
  xlogInterval?: number;
}

export interface RunNMSBackupTaskRequest {
  id: number;
}

export interface DeleteNMSBackupTaskRequest {
  id: number;
}

export interface RevertNMSBackupTaskRequest {
  id: number;
}

export interface GetNMSBackupLogDetailRequest {
  logId: number;
}