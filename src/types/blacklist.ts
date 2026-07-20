export interface ListDeviceBlackListVO {
  id: number;
  sn: string;
  username: string;
  addTime: string;
  deviceType: string;
  tenancyName: string;
  reason: string;
}

export interface BlackListOperationLogVO {
  id: number;
  deviceSn: string;
  deviceType: string;
  operationType: string;
  operatorUsername: string;
  operationTime: string;
  operationReason: string;
  tenancyName: string;
}

export interface ListBlackListQuery {
  sn?: string;
  page: number;
  pageSize: number;
}

export interface AddDeviceToBlackListRequest {
  sn: string;
  deviceType: string;
  reason?: string;
}

export interface BatchDeleteRequest {
  ids: number[];
}

export interface ListBlackListOperationLogQuery {
  searchText?: string;
  deviceSn?: string;
  operationType?: string;
  deviceType?: string;
  startTime?: string;
  endTime?: string;
  page: number;
  pageSize: number;
}
