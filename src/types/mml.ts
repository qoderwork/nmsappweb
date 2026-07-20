export interface MmlCommand {
  id: number;
  command?: string;
  hint?: string;
  name?: string;
  help_file?: string;
  mml_set_id?: number;
  type?: string;
}

export interface MmlCommandParam {
  id: number;
  name?: string;
  parameter?: string;
  value_range?: string;
  type?: string;
  od: number;
  necessity: boolean;
  mml_command_id?: number;
  writable: boolean;
  option?: string;
  default_value?: string;
  relate?: string;
}

export interface MmlSet {
  id: number;
  name?: string;
  parent_id?: number;
  license_id?: number;
  version?: string;
}

export interface MmlExecuteResult {
  id: number;
  element_id?: number;
  result_returned_time?: string;
  command?: string;
  result?: string;
  uid?: string;
  status: number;
  has_fault: boolean;
  fault_string?: string;
  user?: string;
  ue_task_id?: number;
  event_log_id?: number;
  operation_time?: string;
  send_time?: string;
}

export interface GetMMLResultByEventLogIdsVO {
  mml: string;
  deviceName: string;
  serialNumber: string;
  result: string;
}

export interface ExecuteMmlRequest {
  element_id: number;
  command: string;
  uid: string;
  params?: Record<string, any>;
}

export interface GetMMLResultByEventLogIdsRequest {
  event_log_ids: number[];
}