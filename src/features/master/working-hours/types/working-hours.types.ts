/**
 * Working Hours types — documented fields from apilist.txt only.
 */

/** Laravel WorkingHoursGet / WorkingHoursUpdate response `data`. */
export type WorkingHoursDto = {
  timing_id: number;
  opening_time: string;
  closing_time: string;
  session_timeout_min: number;
  working_days_desc: string | null;
  allow_sunday_login: boolean;
  lockout_holidays: boolean;
  allow_offline_collection: boolean;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
};

/** Frontend domain model (camelCase). Times are always HH:mm. */
export type WorkingHours = {
  timingId: number;
  openingTime: string;
  closingTime: string;
  sessionTimeoutMin: number;
  workingDaysDesc: string | null;
  allowSundayLogin: boolean;
  lockoutHolidays: boolean;
  allowOfflineCollection: boolean;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

/** Writable update payload (domain). Times must be HH:mm. */
export type WorkingHoursUpdateInput = {
  openingTime: string;
  closingTime: string;
  sessionTimeoutMin: number;
  workingDaysDesc?: string | null;
  allowSundayLogin?: boolean;
  lockoutHolidays?: boolean;
  allowOfflineCollection?: boolean;
};

/** Laravel WorkingHoursUpdate request body. */
export type WorkingHoursUpdateDto = {
  opening_time: string;
  closing_time: string;
  session_timeout_min: number;
  working_days_desc?: string | null;
  allow_sunday_login?: boolean;
  lockout_holidays?: boolean;
  allow_offline_collection?: boolean;
};
