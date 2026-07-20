// Monitor task / data / elements / parameters types

export interface MonitorTask {
  id?: number;
  task_name?: string;
  license_id?: number;
  enable?: boolean;
  execution_scope?: number;
  scope_data?: string;
}

export interface MonitorData {
  id?: number;
  element_id?: number;
  sample_time?: string;
  parameter_id?: string;
  value?: number;
}

export interface MonitorStatPoint {
  element_id: number;
  sample_time: string;
  value: number;
}

export interface MonitorStatistics {
  parameter_id: string;
  points: MonitorStatPoint[];
  avg: number;
  min: number;
  max: number;
  count: number;
}

export interface MonitorElements {
  id?: number;
  element_id?: number;
  task_id?: number;
}

export interface MonitorParameters {
  id?: number;
  parameter_id?: string;
  task_id?: number;
}

export interface SaveMonitorElementsRequest {
  element_ids: number[];
}

export interface SaveMonitorParametersRequest {
  parameter_ids: string[];
}
