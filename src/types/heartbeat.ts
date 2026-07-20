export interface HeartbeatStatus {
  sn: string;
  status: string;
  lastHeartbeatTime: string;
  deviceType: string;
}

export interface HeartbeatQuery {
  page: number;
  pageSize: number;
}
