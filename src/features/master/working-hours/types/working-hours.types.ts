/**
 * Working Hours types — documented fields from apilist.txt only.
 */

/** Laravel WorkingHoursGet / WorkingHoursUpdate response `data`. */
export type WorkingHoursDto = {
  id: number;
  sod_time: string;
  eod_time: string;
  batch_exe_time: string | null;
  session_inc_time: string;
};

/** Frontend domain model (camelCase). Times are always HH:mm. */
export type WorkingHours = {
  id: number;
  sodTime: string;
  eodTime: string;
  batchExeTime: string | null;
  sessionIncTime: string;
};

/** Writable update payload (domain). Times must be HH:mm. */
export type WorkingHoursUpdateInput = {
  sodTime: string;
  eodTime: string;
  batchExeTime?: string | null;
  sessionIncTime: string;
};

/** Laravel WorkingHoursUpdate request body. */
export type WorkingHoursUpdateDto = {
  sod_time: string;
  eod_time: string;
  batch_exe_time?: string | null;
  session_inc_time: string;
};
