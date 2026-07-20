export interface NorthInterfaceLog {
  id: number;
  interfaceType: string;
  message: string;
  status: string;
  createTime: string;
  operator: string;
}

export interface NorthInterfaceLogQuery {
  interfaceType?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  page: number;
  pageSize: number;
}
