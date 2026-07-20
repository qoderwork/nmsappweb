export interface DateVO {
  date: string;
}

export interface ZoneVO {
  zoneName: string;
}

export interface PlatformLogConfig {
  level: string;
}

export interface FTPTransferLogConfig {
  username: string;
  password: string;
  host: string;
  port?: number | null;
  uploadPath: string;
  passwordChange?: boolean | null;
}

export interface HECConfig {
  url: string;
  token: string;
  mode: string;
}

export interface NMSSecret {
  emailSecret: string;
  addressSecret: string;
  passwordSecret: string;
}
