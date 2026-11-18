import type { z } from "zod";
import type { globalSettingsDtoSchema } from "@/features/master/global-settings/schemas/global-settings.schema";
import {
  DEFAULT_LANGUAGE_OPTIONS,
  GLOBAL_SETTINGS_DEFAULTS,
  type DefaultLanguage,
  type GlobalSettings,
  type GlobalSettingsUpdateDto,
} from "@/features/master/global-settings/types/global-settings.types";
import type { SecurityPolicy } from "@/features/security/login-settings/types/login-settings.types";

type ParsedDto = z.infer<typeof globalSettingsDtoSchema>;

function toLanguage(value: string): DefaultLanguage {
  return (DEFAULT_LANGUAGE_OPTIONS as string[]).includes(value)
    ? (value as DefaultLanguage)
    : GLOBAL_SETTINGS_DEFAULTS.defaultLanguage;
}

/** Password expiry and login attempts come from the Security Policy row. */
export function mapGlobalSettings(dto: ParsedDto | null, policy: SecurityPolicy): GlobalSettings {
  const security = {
    passwordExpiryDays: policy.expirationEnabled ? policy.expirationDays : 0,
    loginAttemptLimit: policy.maxAttempts,
  };
  if (!dto) return { ...GLOBAL_SETTINGS_DEFAULTS, ...security };
  return {
    defaultLanguage: toLanguage(dto.default_language),
    ...security,
    allowBackdatedTxn: dto.allow_backdated_txn,
    maxBackdateDays: dto.allow_backdated_txn ? dto.max_backdate_days : 0,
    dayEndRequired: dto.day_end_required,
    monthEndRequired: dto.month_end_required,
    yearEndRequired: dto.year_end_required,
    panRequired: dto.pan_required,
    aadhaarRequired: dto.aadhaar_required,
    voterIdRequired: dto.voter_id_required,
    geoTaggingRequired: dto.geo_tagging_required,
  };
}

const flag = (value: boolean): 0 | 1 => (value ? 1 : 0);

export function mapGlobalSettingsUpdateToDto(input: GlobalSettings): GlobalSettingsUpdateDto {
  return {
    default_language: input.defaultLanguage,
    allow_backdated_txn: flag(input.allowBackdatedTxn),
    max_backdate_days: input.allowBackdatedTxn ? input.maxBackdateDays : 0,
    day_end_required: flag(input.dayEndRequired),
    month_end_required: flag(input.monthEndRequired),
    year_end_required: flag(input.yearEndRequired),
    pan_required: flag(input.panRequired),
    aadhaar_required: flag(input.aadhaarRequired),
    voter_id_required: flag(input.voterIdRequired),
    geo_tagging_required: flag(input.geoTaggingRequired),
  };
}
