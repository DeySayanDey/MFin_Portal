import type {
  LoginSecurityDraft,
  SecurityPolicy,
  SecurityPolicyDto,
  SecurityPolicyUpdateDto,
} from "@/features/security/login-settings/types/login-settings.types";

function toHhmm(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value.trim();
  return `${match[1]!.padStart(2, "0")}:${match[2]}`;
}

export function mapSecurityPolicyDto(dto: SecurityPolicyDto): SecurityPolicy {
  return {
    id: dto.id,
    maxAttempts: dto.max_attempts,
    lockMinutes: dto.lock_minutes,
    dailyResetTime: toHhmm(dto.daily_reset_time),
    minLength: dto.min_chars,
    maxLength: dto.max_chars,
    requireUppercase: dto.require_upper,
    requireLowercase: dto.require_lower,
    requireDigit: dto.require_number,
    requireSpecial: dto.require_special,
    uniquePasswordCount: dto.unique_recent,
    expirationEnabled: dto.passwords_expire,
    expirationDays: dto.expire_days,
  };
}

export function mapSecurityPolicyUpdateToDto(
  input: LoginSecurityDraft,
): SecurityPolicyUpdateDto {
  return {
    max_attempts: input.maxAttempts,
    lock_minutes: input.lockMinutes,
    daily_reset_time: toHhmm(input.dailyResetTime),
    min_chars: input.minLength,
    max_chars: input.maxLength,
    require_upper: input.requireUppercase,
    require_lower: input.requireLowercase,
    require_number: input.requireDigit,
    require_special: input.requireSpecial,
    unique_recent: input.uniquePasswordCount,
    passwords_expire: input.expirationEnabled,
    expire_days: input.expirationDays,
  };
}
