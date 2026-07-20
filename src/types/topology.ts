/**
 * 拓扑管理类型定义
 * 对齐 nmsappsrv 后端 topology/model.go
 */

/** 拓扑设备节点 */
export interface TopologyDevice {
  portIndex: number;
  type: string;
  serialNumber: string;
  ip: string;
  softwareVersion: string;
  deviceType: string;
  connectStatus: number;
  route: string;
  nextLevelDevices: TopologyDevice[];
}

/** BBU 端口 */
export interface TopologyBBUPort extends TopologyDevice {
  // 继承 TopologyDevice 的所有字段
}

/** BBU 拓扑 */
export interface TopologyBBU {
  deviceName: string | null;
  serialNumber: string | null;
  ports: TopologyBBUPort[];
}

/** LTE 拓扑响应 */
export interface LteTopologyResponse {
  bbu: TopologyBBU | null;
}

/** NR 拓扑响应 */
export interface NrTopologyResponse {
  bbu: TopologyBBU | null;
}

/** 批量升级请求 */
export interface BatchUpgradeRequest {
  elementId: number;
  devices: DeviceAndUpgradeFile[];
}

/** 设备与升级文件映射 */
export interface DeviceAndUpgradeFile {
  route: string;
  upgradeFileId: number;
}

/** 批量升级日志查询 */
export interface ListBatchUpgradeLogQuery {
  elementId: number;
  operationUser?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

/** 版本变更信息 */
export interface VersionChange {
  serialNumber: string;
  originalVersion: string;
  upgradedVersion: string;
  upgradeFileName: string;
  faultInfo: string;
}

/** 批量升级日志 VO */
export interface ListBatchUpgradeLogVO {
  operationTime: string | null;
  downloadedTime: string | null;
  upgradedTime: string | null;
  result: number | null;
  operationUser: string;
  faultInfo: string;
  versionInfo: VersionChange[];
}

/** ID 请求 */
export interface LongIdRequest {
  id: number;
}
