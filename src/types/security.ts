export interface SecurityRule {
  maximumNumberOfFailedLoginAttempts: number;
  minimumLengthOfUsername: number;
  maximumLengthOfUsername: number;
  minimumLengthOfPassword: number;
  maximumLengthOfPassword: number;
  minimumLengthOfAdminPassword: number;
  maximumLengthOfAdminPassword: number;
}

export interface PasswordStrategy {
  minimumLengthOfPassword: number;
  maximumLengthOfPassword: number;
  minimumLengthOfAdminPassword: number;
  maximumLengthOfAdminPassword: number;
}

export interface UpdateSecurityRuleRequest {
  maximumNumberOfFailedLoginAttempts?: number;
  minimumLengthOfUsername?: number;
  maximumLengthOfUsername?: number;
  minimumLengthOfPassword?: number;
  maximumLengthOfPassword?: number;
  minimumLengthOfAdminPassword?: number;
  maximumLengthOfAdminPassword?: number;
}