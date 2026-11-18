/** Laravel `GET /api/SecurityPolicyGet` row. */
export type SecurityPolicyDto = {
  id: number;
  max_attempts: number;
  lock_minutes: number;
  daily_reset_time: string;
  min_chars: number;
  max_chars: number;
  require_upper: boolean;
  require_lower: boolean;
  require_number: boolean;
  require_special: boolean;
  unique_recent: number;
  passwords_expire: boolean;
  expire_days: number;
};

/** Body for `POST /api/SecurityPolicyUpdate` (no id). */
export type SecurityPolicyUpdateDto = Omit<SecurityPolicyDto, "id">;

export type LoginSecurityDraft = {
  maxAttempts: number;
  lockMinutes: number;
  dailyResetTime: string;
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
  uniquePasswordCount: number;
  expirationEnabled: boolean;
  expirationDays: number;
};

export type SecurityPolicy = LoginSecurityDraft & {
  id: number;
};

export const LOGIN_SECURITY_DEFAULTS: LoginSecurityDraft = {
  maxAttempts: 5,
  lockMinutes: 15,
  dailyResetTime: "00:00",
  minLength: 8,
  maxLength: 32,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  uniquePasswordCount: 5,
  expirationEnabled: true,
  expirationDays: 90,
};
