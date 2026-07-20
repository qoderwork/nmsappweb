/**
 * 设备相关类型定义
 * 对齐 nmsappsrv 后端 device/model.go
 */

/** 设备状态 */
export type DeviceStatus = 'online' | 'offline' | 'unknown';

/** 设备类型 */
export type DeviceType = 'gnb' | 'enb' | 'cpe';

/** 设备实体（对齐 CpeElement） */
export interface Device {
  ne_neid: number;
  ne_areaid?: number | null;
  serial_number?: string | null;
  device_name?: string | null;
  installation_location?: string | null;
  software_version?: string | null;
  device_ip?: string | null;
  site_id?: string | null;
  hardware_version?: string | null;
  creation_time?: string | null;
  product?: string | null;
  maintainer_info_id?: string | null;
  loaded_basic_info?: boolean;
  is_initialized?: boolean;
  is_new_version?: boolean;
  open_station_config_status?: string | null;
  manufacturer?: string | null;
  oui?: string | null;
  last_log_collection_time?: string | null;
  cbsd_cert_file?: string | null;
  cbsd_cert_file_upload_time?: string | null;
  config_file?: string | null;
  config_file_upload_time?: string | null;
  generation?: string | null;
  longitude?: string | null;
  latitude?: string | null;
  ip?: string | null;
  aos_file_name?: string | null;
  ready_to_ztp?: boolean | null;
  wifi_or_gps_info?: string | null;
  initial_id?: number | null;
  status?: string | null;
  port?: number | null;
  e911_data?: string | null;
  ztp_parameters?: string | null;
  mac?: string | null;
  full_software_version?: string | null;
  target_version?: string | null;
  stm_version?: string | null;
  target_hardware_version?: string | null;
  market?: string | null;
  psap_id?: string | null;
  firmware_version?: string | null;
  root_node?: string | null;
  license_id?: number | null;
  device_type?: DeviceType | null;
  deleted?: boolean;
  model_name?: string | null;
  coon_req_url?: string | null;
  in_diagnostics?: boolean | null;
  low_resource?: boolean | null;
  connection_request_username?: string | null;
  connection_request_password?: string | null;
}

/** 设备分组（对齐 DeviceGroup） */
export interface DeviceGroup {
  id: string;
  group_name?: string | null;
  description?: string | null;
  creation_time?: string | null;
  license_id?: number | null;
  default_group?: boolean;
}

/** 设备查询参数 */
export interface DeviceQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  deviceType?: DeviceType;
  groupId?: string;
  status?: DeviceStatus;
  [key: string]: unknown;
}

/** 设备导入结果 */
export interface DeviceImportResult {
  addedCount: number;
  modifiedCount: number;
  deletedCount: number;
  failedCount: number;
  addedIds: number[];
  errors?: string[];
}