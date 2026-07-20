export interface PMFile {
  id: number;
  name: string;
  size: number;
  status: string;
  createTime: string;
  deviceSn: string;
}

export interface PMFileQuery {
  deviceSn?: string;
  page: number;
  pageSize: number;
}
