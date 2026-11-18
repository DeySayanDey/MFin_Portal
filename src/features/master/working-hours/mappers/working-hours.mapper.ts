import type {
  WorkingHours,
  WorkingHoursUpdateDto,
  WorkingHoursUpdateInput,
} from "@/features/master/working-hours/types/working-hours.types";

export function mapWorkingHoursDto(dto: {
  id: number;
  sod_time: string;
  eod_time: string;
  batch_exe_time?: string | null;
  session_inc_time: string;
}): WorkingHours {
  return {
    id: dto.id,
    sodTime: dto.sod_time,
    eodTime: dto.eod_time,
    batchExeTime: dto.batch_exe_time ?? null,
    sessionIncTime: dto.session_inc_time,
  };
}

export function mapWorkingHoursUpdateToDto(
  input: WorkingHoursUpdateInput,
): WorkingHoursUpdateDto {
  const dto: WorkingHoursUpdateDto = {
    sod_time: input.sodTime,
    eod_time: input.eodTime,
    session_inc_time: input.sessionIncTime,
  };

  if (input.batchExeTime !== undefined) {
    const trimmed =
      input.batchExeTime == null ? null : input.batchExeTime.trim();
    dto.batch_exe_time = trimmed === "" ? null : trimmed;
  }

  return dto;
}
