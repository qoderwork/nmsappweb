import { http } from '@/utils/request';
import type {
  DateVO,
  ZoneVO,
  PlatformLogConfig,
  FTPTransferLogConfig,
  HECConfig,
  NMSSecret,
} from '@/types/platform';

const BASE = '';
const DOWNLOAD_BASE = '/api/v1';

// 系统日期
export function getDate() {
  return http.get<DateVO>(`${BASE}/platform/date`);
}

// 时区列表
export function getSupportedZone() {
  return http.get<ZoneVO[]>(`${BASE}/platform/zones`);
}

// Logo（base64 字符串）
export function getLogo() {
  return http.get<string>(`${BASE}/platform/logo`);
}

// 日志配置
export function listLogConfig() {
  return http.get<PlatformLogConfig>(`${BASE}/platform/log-config`);
}

export function updateLogConfig(data: PlatformLogConfig) {
  return http.put<void>(`${BASE}/platform/log-config`, data);
}

// SFTP 日志传输配置
export function getFTPTransferLogConfig() {
  return http.get<FTPTransferLogConfig>(`${BASE}/platform/ftp-log-config`);
}

export function updateFTPTransferLogConfig(data: FTPTransferLogConfig) {
  return http.put<void>(`${BASE}/platform/ftp-log-config`, data);
}

// HEC 配置
export function getHECConfig() {
  return http.get<HECConfig>(`${BASE}/platform/hec-config`);
}

export function updateHECConfig(data: HECConfig) {
  return http.put<void>(`${BASE}/platform/hec-config`, data);
}

// NMS 加密配置
export function listNMSSecret() {
  return http.get<NMSSecret>(`${BASE}/platform/secrets`);
}

export function updateNMSSecret(data: NMSSecret) {
  return http.put<void>(`${BASE}/platform/secrets`, data);
}

// 下载 RSA 公钥
export function downloadRSAPublicKey() {
  return `${DOWNLOAD_BASE}/platform/downloads/rsa-public-key`;
}

// 下载平台日志（POST，返回 zip 流）
export function downloadPlatformLogsURL() {
  return `${DOWNLOAD_BASE}/platform/downloads/logs`;
}

// 下载 NMS 操作手册
export function downloadManualURL() {
  return `${DOWNLOAD_BASE}/platform/downloads/manual`;
}
