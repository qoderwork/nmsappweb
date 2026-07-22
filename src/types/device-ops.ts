// Reboot / Reset / Shutdown device operations

// ---------- Reboot ----------
export interface RebootTask {
  id?: number;
  name: string;
  user?: string;
  operationTime?: string;
  status: number; // 1=Waiting 2=Executing 3=Executed 4=Cancelled
  startTime?: string;
  endTime?: string;
  executeMode: number; // 1=immediate 2=wait 3=scheduled
  triggerTime?: string;
  tenantId?: number;
  elementIds: string;
  deviceType: string;
  scope: string; // element / deviceGroup
  deviceGroupIds?: string;
  softReboot?: boolean;
}

export interface AddRebootTaskRequest {
  name: string;
  executeMode: number;
  triggerTime?: string | null;
  elementIds: number[];
  deviceType: string;
  scope: string;
  deviceGroupIds?: string[];
  softReboot?: boolean;
}

export interface ListRebootTaskQuery {
  taskName?: string;
  startTime?: string;
  endTime?: string;
  deviceType?: string;
  page: number;
  pageSize: number;
}

export interface RebootTaskVO {
  id: number;
  name: string;
  user: string;
  operationTime: string;
  status: number;
  progress: string;
  results?: number;
  startTime?: string;
  endTime?: string;
  tenancyName?: string;
}

export interface RebootTaskResultVO {
  serialNumber: string;
  deviceName: string;
  status: number;
  results?: number;
  failureReason?: string;
  time?: string;
  elementId: number;
}

// ---------- Reset ----------
export interface ResetTask {
  id?: number;
  name: string;
  user?: string;
  operationTime?: string;
  status: number;
  startTime?: string;
  endTime?: string;
  executeMode: number;
  triggerTime?: string;
  tenantId?: number;
  elementIds: string;
  deviceType: string;
  scope: string;
  deviceGroupIds?: string;
}

export interface AddResetTaskRequest {
  name: string;
  executeMode: number;
  triggerTime?: string | null;
  elementIds: number[];
  deviceType: string;
  scope: string;
  deviceGroupIds?: string[];
}

export interface ListResetTaskQuery {
  taskName?: string;
  startTime?: string;
  endTime?: string;
  deviceType?: string;
  page: number;
  pageSize: number;
}

export interface ResetTaskVO {
  id: number;
  name: string;
  user: string;
  operationTime: string;
  status: number;
  progress: string;
  results?: number;
  startTime?: string;
  endTime?: string;
  tenancyName?: string;
}

export interface ResetTaskResultVO {
  serialNumber: string;
  deviceName: string;
  status: number;
  results?: number;
  failureReason?: string;
  time?: string;
  tenancyName?: string;
  elementId: number;
}

// ---------- Shutdown ----------
export interface AddShutdownTaskRequest {
  name: string;
  executeMode: number; // 1=immediate 2=awaiting 3=scheduled
  triggerTime?: string;
  elementIds: number[];
}

export interface ListShutdownTaskRequest {
  page: number;
  pageSize: number;
}

export interface ShutdownTaskVo {
  id: number;
  name: string;
  operationUser: string;
  operationTime: string;
  status: number;
  executeMode: number;
  deviceCount: number;
  progress: string;
}

export interface ViewShutdownTaskRequest {
  taskId: number;
}

export interface ShutdownDeviceVo {
  elementId: number;
  deviceName: string;
  serialNumber: string;
}

export interface ViewShutdownTaskVo {
  id: number;
  name: string;
  operationUser: string;
  operationTime: string;
  status: number;
  executeMode: number;
  triggerTime: string;
  devices: ShutdownDeviceVo[];
}

export interface ListShutdownResultRequest {
  taskId: number;
  page: number;
  pageSize: number;
}

export interface ShutdownResultVo {
  elementId: number;
  deviceName: string;
  serialNumber: string;
  status: number;
  time: string;
}

export interface DeleteShutdownTaskRequest {
  taskId: number;
}
