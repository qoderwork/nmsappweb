import { http } from '@/utils/request';
import type { MailConfig, UpdateMailConfigRequest, IsEnabledResponse } from '@/types/mail';

export function getMailConfig() {
  return http.get<MailConfig>('/mail/config');
}

export function updateMailConfig(data: UpdateMailConfigRequest) {
  return http.put('/mail/config', data);
}

export function testMail() {
  return http.post('/mail/test');
}

export function isEmailAuthEnabled() {
  return http.get<IsEnabledResponse>('/mail/email-auth-enabled');
}