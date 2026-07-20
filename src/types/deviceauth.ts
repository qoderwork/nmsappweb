export interface DeviceAuthConfig {
  authType: string;
  authUrl: string;
  authUsername: string;
  authPassword: string;
  verifySSL: boolean;
}

export interface DeviceAuthInfo {
  sn: string;
  status: string;
  lastAuthTime: string;
}

export interface DeviceAuthInfoQuery {
  page: number;
  pageSize: number;
}
