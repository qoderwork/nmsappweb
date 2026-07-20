export interface NetworkCard {
  name: string;
  description: string;
  ipAddress: string;
  macAddress: string;
}

export interface CaptureRequest {
  networkCard: string;
  duration: number;
  fileSize: number;
  filter?: string;
}

export interface TcpdumpFile {
  id: number;
  name: string;
  size: number;
  createTime: string;
}

export interface TcpdumpBatchDeleteRequest {
  names: string[];
}
