export interface ResourcesVO {
  cpu: number;
  mem: number;
  timestamp: string;
}

export interface TableStatusVO {
  tableName: string;
  tableRows: number;
  sizeGB: number;
}

export interface DiskUsageVO {
  filesystem: string;
  size: string;
  used: string;
  avail: string;
  usePercent: string;
  mountPoint: string;
}

export interface ThresholdConfig {
  cpu: number;
  mem: number;
  disk: number;
  diskClear: number;
  table: number;
}
