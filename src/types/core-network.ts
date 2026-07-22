export interface CoreNetwork {
  id: number;
  name?: string;
  element_id?: number;
  tenant_id?: number;
  deleted?: boolean;
  install_location?: string;
  ip?: string;
  port?: number;
}

export interface CoreNetworkOperationLog {
  id: number;
  log_type?: string;
  user?: string;
  operation_time?: string;
  response_time?: string;
  result?: number;
  info?: string;
}

export interface CoreNetworkAlarmVo {
  id: number;
  severity?: string;
  alarmIdentifier?: string;
  probableCause?: string;
  eventTime?: string;
  alarmStatus?: number;
}

export interface UeInfo {
  imsi: string;
  imei: string;
  msisdn: string;
  state: string;
  startTime: string;
}

export interface UeListVo {
  imsi: string;
  msisdn: string;
  category: string;
}

export interface UeNumberStatisticVo {
  total: number;
  byCategory: Record<string, number>;
  byState: Record<string, number>;
  generatedAt: string;
}

export interface CoreNetworkUserInfoVo {
  totalUsers: number;
  activeUsers: number;
  idleUsers: number;
  byCoreNet: Record<string, number>;
  generatedAt: string;
}

export interface CoreNetworkUpfTrafficVo {
  uplinkBps: number;
  downlinkBps: number;
  totalBytes: number;
  generatedAt: string;
}

export interface KpiReportRow {
  timestamp: string;
  metrics: Record<string, any>;
}

export interface GetCoreNetworkParametersQuery {
  coreNetworkId: number;
  elementType: string;
}

export interface SetCoreNetworkParametersDTO {
  coreNetworkId: number;
  name: string;
  index?: number;
  data: string;
  elementType: string;
}

export interface QueryCoreNetworkParametersDTO {
  coreNetworkId: number;
  name: string;
  elementType: string;
}

export interface DeleteCoreNetworkParameterDTO {
  coreNetworkId: number;
  name: string;
  index: number;
  elementType: string;
}

export interface ChangeCoreNetworkSwitchRequest {
  coreNetworkId: number;
  enable: boolean;
}