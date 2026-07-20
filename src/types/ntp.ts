export interface NTPConfig {
  ntpServer: string;
  enable: boolean;
}

export interface NTPConfigRequest {
  ntpServer: string;
  enable: boolean;
}

export interface NTPStatusResponse {
  status: string;
}