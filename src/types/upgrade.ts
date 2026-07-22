/**
 * 升级管理类型定义
 * 对齐 nmsappsrv 后端 upgrade/model.go
 */

/** 升级任务状态 */
export type UpgradeTaskStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 升级任务实体 */
export interface UpgradeTask {
  id: number;
  name?: string | null;
  user?: string | null;
  operation_time?: string | null;
  status?: UpgradeTaskStatus | null;
  start_time?: string | null;
  end_time?: string | null;
  execute_mode?: number | null;
  trigger_time?: string | null;
  tenant_id?: number | null;
  element_ids?: string | null;
  device_type?: string | null;
  upgrade_type?: string | null;
  upgrade_file_id?: number | null;
  source?: string | null;
  activation_mode?: number | null;
  activation_time?: string | null;
  scope?: string | null;
  device_group_ids?: string | null;
  concurrent_number?: number | null;
  max_retry_times?: number | null;
  manual_upgrade?: boolean | null;
  allow_same_version_upgrade?: number | null;
}

/** 升级任务列表响应 VO */
export interface UpgradeTaskVo {
  id: number;
  name: string;
  user: string;
  operationTime: string;
  status?: UpgradeTaskStatus | null;
  startTime: string;
  endTime: string;
  executeMode?: number | null;
  deviceType: string;
  upgradeType: string;
  version: string;
  deviceCount: number;
  progress: string;
  successCount: number;
  failCount: number;
  tenancyName: string;
}

/** 升级文件实体 */
export interface UpgradeFile {
  id: number;
  file_name?: string | null;
  file_path?: string | null;
  version?: string | null;
  device_type?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  tenant_id?: number | null;
  upload_time?: string | null;
  user?: string | null;
  product_type?: string | null;
  original_file_name?: string | null;
}

/** 升级日志 */
export interface UpgradeLog {
  id: string;
  ne_id?: number | null;
  creation_time?: string | null;
  old_version?: string | null;
  new_version?: string | null;
  done_time?: string | null;
  is_done?: boolean | null;
  message?: string | null;
  file_id?: string | null;
  is_downloaded?: boolean | null;
  downloaded_time?: string | null;
  upgrade_type?: string | null;
  task_id?: number | null;
  success?: boolean | null;
  retry_times?: number | null;
}

/** 回滚任务 */
export interface RollbackTask {
  id: number;
  name?: string | null;
  user?: string | null;
  operation_time?: string | null;
  status?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  execute_mode?: number | null;
  trigger_time?: string | null;
  tenant_id?: number | null;
  element_ids?: string | null;
  scope?: string | null;
  device_group_ids?: string | null;
}

/** 升级结果 VO */
export interface UpgradeResultVo {
  id: number;
  task_id: number;
  element_id: number;
  device_name: string;
  serial_number: string;
  old_version: string;
  new_version: string;
  status: number;
  success: boolean;
  message: string;
  creation_time: string;
  done_time: string;
}

/** 状态统计 */
export interface StatusCountItem {
  status: number;
  count: number;
}

/** 设备结果统计 */
export interface DeviceResultCountItem {
  result: string;
  count: number;
}

/** 升级任务查询参数 */
export interface UpgradeTaskQueryParams {
  page?: number;
  pageSize?: number;
  searchText?: string;
  taskName?: string;
  startTime?: string;
  endTime?: string;
  deviceType?: string;
  [key: string]: unknown;
}
