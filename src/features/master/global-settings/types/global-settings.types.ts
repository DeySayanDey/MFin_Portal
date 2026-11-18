/** Contract: docs/global-settings-api.md. */

export type DefaultLanguage = "en" | "bn" | "hi" | "or";

export const DEFAULT_LANGUAGE_OPTIONS: DefaultLanguage[] = ["en", "bn", "hi", "or"];

/** Laravel `GET /api/GlobalSettingsGet` row. */
export type GlobalSettingsDto = {
  default_language: string;
  allow_backdated_txn: boolean | number | string;
  max_backdate_days: number | string;
  day_end_required: boolean | number | string;
  month_end_required: boolean | number | string;
  year_end_required: boolean | number | string;
  pan_required: boolean | number | string;
  aadhaar_required: boolean | number | string;
  voter_id_required: boolean | number | string;
  geo_tagging_required: boolean | number | string;
  updated_by_name?: string | null;
  updated_at?: string | null;
};

/** Body for `POST /api/GlobalSettingsUpdate`. */
export type GlobalSettingsUpdateDto = {
  default_language: DefaultLanguage;
  allow_backdated_txn: 0 | 1;
  max_backdate_days: number;
  day_end_required: 0 | 1;
  month_end_required: 0 | 1;
  year_end_required: 0 | 1;
  pan_required: 0 | 1;
  aadhaar_required: 0 | 1;
  voter_id_required: 0 | 1;
  geo_tagging_required: 0 | 1;
};

export type GlobalSettings = {
  defaultLanguage: DefaultLanguage;
  /** Stored in Security Policy (`expire_days`). 0 means passwords never expire. */
  passwordExpiryDays: number;
  /** Stored in Security Policy (`max_attempts`). */
  loginAttemptLimit: number;
  allowBackdatedTxn: boolean;
  maxBackdateDays: number;
  dayEndRequired: boolean;
  monthEndRequired: boolean;
  yearEndRequired: boolean;
  panRequired: boolean;
  aadhaarRequired: boolean;
  voterIdRequired: boolean;
  geoTaggingRequired: boolean;
};

export type GlobalSettingsView = GlobalSettings & {
  /** False when Laravel has no settings row yet; the form shows defaults. */
  configured: boolean;
  updatedByName: string | null;
  updatedAt: string | null;
};

export type GlobalSettingsUpdateInput = GlobalSettings;

export const GLOBAL_SETTINGS_DEFAULTS: GlobalSettings = {
  defaultLanguage: "en",
  passwordExpiryDays: 90,
  loginAttemptLimit: 5,
  allowBackdatedTxn: false,
  maxBackdateDays: 0,
  dayEndRequired: true,
  monthEndRequired: true,
  yearEndRequired: true,
  panRequired: false,
  aadhaarRequired: true,
  voterIdRequired: false,
  geoTaggingRequired: false,
};
