import { http } from '@/utils/request';
import type { SecurityRule, PasswordStrategy, UpdateSecurityRuleRequest } from '@/types/security';

export function getSecurityRule() {
  return http.get<SecurityRule>('/security/rules');
}

export function updateSecurityRule(data: UpdateSecurityRuleRequest) {
  return http.put('/security/rules', data);
}

export function getPasswordStrategy() {
  return http.get<PasswordStrategy>('/security/password-strategy');
}