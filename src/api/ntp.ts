import { http } from '@/utils/request';
import type { NTPConfig, NTPConfigRequest, NTPStatusResponse } from '@/types/ntp';

export function getNtpConfig() {
  return http.get<NTPConfig>('/ntp/config');
}

export function updateNtpConfig(data: NTPConfigRequest) {
  return http.put('/ntp/config', data);
}

export function getNtpStatus() {
  return http.get<NTPStatusResponse>('/ntp/status');
}