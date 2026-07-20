export interface MailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  mailAuthentication: boolean;
  superUserEmail: string;
}

export interface UpdateMailConfigRequest {
  host: string;
  port: number;
  username: string;
  password?: string;
  mailAuthentication: boolean;
  superUserEmail?: string;
}

export interface IsEnabledResponse {
  enabled: boolean;
}