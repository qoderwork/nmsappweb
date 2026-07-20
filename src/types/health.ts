export interface MysqlInfo {
  uptime: string;
  threadsConnected: string;
  abortedConnects: string;
  slowQueries: string;
  createdTmpTables: string;
  createdTmpDiskTables: string;
  tableLocksWaited: string;
  comRollback: string;
}

export interface RedisInfo {
  processId: string;
  redisVersion: string;
  gccVersion: string;
  uptimeInSeconds: string;
  uptimeInDays: string;
  connectedClients: string;
  totalConnectionsReceived: string;
  totalCommandsProcessed: string;
}

export interface QueueInfo {
  queueName: string;
  length: number;
}

export interface HAComponentStatus {
  hostname: string;
  componentName: string;
  status: string;
  oldStatus?: string;
}
