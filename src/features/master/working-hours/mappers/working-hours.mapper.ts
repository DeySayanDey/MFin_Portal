import type {
  WorkingHours,
  WorkingHoursUpdateDto,
  WorkingHoursUpdateInput,
} from "@/features/master/working-hours/types/working-hours.types";

export function mapWorkingHoursDto(dto: {
  timing_id: number;
  opening_time: string;
  closing_time: string;
  session_timeout_min: number;
  working_days_desc?: string | null;
  allow_sunday_login: boolean;
  lockout_holidays: boolean;
  allow_offline_collection: boolean;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
}): WorkingHours {
  return {
    timingId: dto.timing_id,
    openingTime: dto.opening_time,
    closingTime: dto.closing_time,
    sessionTimeoutMin: dto.session_timeout_min,
    workingDaysDesc: dto.working_days_desc ?? null,
    allowSundayLogin: dto.allow_sunday_login,
    lockoutHolidays: dto.lockout_holidays,
    allowOfflineCollection: dto.allow_offline_collection,
    updatedBy: dto.updated_by ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function mapWorkingHoursUpdateToDto(
  input: WorkingHoursUpdateInput,
): WorkingHoursUpdateDto {
  const dto: WorkingHoursUpdateDto = {
    opening_time: input.openingTime,
    closing_time: input.closingTime,
    session_timeout_min: input.sessionTimeoutMin,
  };

  if (input.workingDaysDesc !== undefined) {
    dto.working_days_desc = input.workingDaysDesc;
  }
  if (input.allowSundayLogin !== undefined) {
    dto.allow_sunday_login = input.allowSundayLogin;
  }
  if (input.lockoutHolidays !== undefined) {
    dto.lockout_holidays = input.lockoutHolidays;
  }
  if (input.allowOfflineCollection !== undefined) {
    dto.allow_offline_collection = input.allowOfflineCollection;
  }

  return dto;
}
