import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const boolish = z
  .union([
    z.boolean(),
    z.literal(0),
    z.literal(1),
    z.literal("0"),
    z.literal("1"),
  ])
  .transform((value) => value === true || value === 1 || value === "1");

export const securityPolicyDtoSchema = z.object({
  id: z.coerce.number().int(),
  max_attempts: z.coerce.number().int(),
  lock_minutes: z.coerce.number().int(),
  daily_reset_time: z.string(),
  min_chars: z.coerce.number().int(),
  max_chars: z.coerce.number().int(),
  require_upper: boolish,
  require_lower: boolish,
  require_number: boolish,
  require_special: boolish,
  unique_recent: z.coerce.number().int(),
  passwords_expire: boolish,
  expire_days: z.coerce.number().int(),
});

export const loginSecurityDraftSchema = z
  .object({
    maxAttempts: z.number().int().min(1).max(20),
    lockMinutes: z.number().int().min(1).max(1440),
    dailyResetTime: z.string().regex(timePattern),
    minLength: z.number().int().min(6).max(64),
    maxLength: z.number().int().min(6).max(128),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireDigit: z.boolean(),
    requireSpecial: z.boolean(),
    uniquePasswordCount: z.number().int().min(0).max(24),
    expirationEnabled: z.boolean(),
    expirationDays: z.number().int().min(1).max(365),
  })
  .refine((value) => value.maxLength >= value.minLength, {
    path: ["maxLength"],
  });

export type LoginSecurityDraftParsed = z.infer<typeof loginSecurityDraftSchema>;
