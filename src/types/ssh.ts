/**
 * SSH 管理类型定义
 * 对齐 nmsappsrv 后端 ssh/model.go
 */

/** SSH 标签 */
export interface SSHLabel {
  id: number;
  name: string | null;
  content: string | null;
  tenant_id: number | null;
}

/** 添加 SSH 标签请求 */
export interface AddSSHLabelRequest {
  name: string;
  content: string;
}

/** 更新 SSH 标签请求 */
export interface UpdateSSHLabelRequest {
  id: number;
  name: string;
  content: string;
}

/** 删除 SSH 标签请求 */
export interface DeleteSSHLabelRequest {
  id: number;
}

/** SSH 访问定时器任务 */
export interface SSHAccessTimerTask {
  id: number;
  tenancy_name: string | null;
  tenant_id: number | null;
  element_id: number | null;
  ssh_status: string | null;
  device_name: string | null;
  serial_number: string | null;
  deadline: string | null;
  latest_modify_time: string | null;
}

/** SSH 访问定时器请求 */
export interface SSHAccessTimerRequest {
  deadline: number;
  elementIds: number[];
  deviceGroupIds: string[];
}

/** SSH 访问定时器列表请求 */
export interface ListSSHAccessTimerRequest {
  elementId?: number;
  page: number;
  pageSize: number;
}

/** SSH 访问定时器 VO */
export interface SSHAccessTimerVO {
  id: number;
  elementId: number;
  deviceName: string;
  serialNumber: string;
  sshStatus: string;
  deadline: string | null;
  tenancyName: string;
}

/** WebSSH 连接信息 */
export interface DeviceSSHInfo {
  host: string;
  port: number;
  username: string;
  password: string;
}
