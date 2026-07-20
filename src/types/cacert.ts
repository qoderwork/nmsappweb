export interface CaFile {
  id: number;
  file_name?: string | null;
  url?: string | null;
  del_flag?: string | null;
  create_by?: string | null;
  create_time?: string | null;
  description?: string | null;
}

export interface CaTask {
  id: number;
  task_name?: string | null;
  ca_file_id?: number | null;
  status?: string | null;
  create_by?: string | null;
  create_time?: string | null;
  update_by?: string | null;
  update_time?: string | null;
  tenancy_id?: number | null;
}

export interface DeviceSendCaLog {
  id: number;
  device_id?: number | null;
  result?: number | null;
  scope?: string | null;
  device_group_id?: string | null;
  task_id?: number | null;
  info?: string | null;
  event_log_id?: number | null;
}

export interface CaFileListQuery {
  page: number;
  pageSize: number;
}

export interface CaFileDeleteRequest {
  id: number;
}

export interface CaTaskSaveRequest {
  taskName: string;
  caFileId: number;
  scope?: 'device_group' | 'device';
  deviceIds?: number[];
  groupIds?: string[];
}

export interface CaTaskListQuery {
  page: number;
  pageSize: number;
}

export interface CaTaskDetailQuery {
  id: number;
}

export interface CaTaskDeleteRequest {
  id: number;
}

export interface DeviceCaLogQuery {
  taskId: number;
  page: number;
  pageSize: number;
}

export interface CaTaskDetail {
  task?: CaTask;
  caFile?: CaFile | null;
  deviceLogs?: DeviceSendCaLog[];
}
