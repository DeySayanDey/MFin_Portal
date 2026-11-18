import { z } from "zod";
import {
  hhmmToMinutes,
  isValidHhmm,
} from "@/features/master/working-hours/utils/time-format";

const hhmmSchema = z
  .string()
  .trim()
  .refine(isValidHhmm, { message: "Time must be HH:mm" });

/** Runtime check for WorkingHoursGet / Update response data. */
export const workingHoursDtoSchema = z.object({
  id: z.number(),
  sod_time: z.string(),
  eod_time: z.string(),
  batch_exe_time: z.string().nullable().optional(),
  session_inc_time: z.string(),
});

/**
 * Domain update validation — documented rules only.
 * Times must already be normalized to HH:mm before validation.
 */
export const workingHoursUpdateInputSchema = z
  .object({
    sodTime: hhmmSchema,
    eodTime: hhmmSchema,
    batchExeTime: z
      .string()
      .trim()
      .nullable()
      .optional()
      .refine(
        (value) => value == null || value === "" || isValidHhmm(value),
        { message: "Time must be HH:mm" },
      ),
    sessionIncTime: hhmmSchema,
  })
  .superRefine((value, ctx) => {
    const sodMins = hhmmToMinutes(value.sodTime);
    const eodMins = hhmmToMinutes(value.eodTime);
    if (sodMins == null || eodMins == null) return;
    if (eodMins <= sodMins) {
      ctx.addIssue({
        code: "custom",
        path: ["eodTime"],
        message: "End of day must be later than start of day",
      });
    }
  });

export type WorkingHoursUpdateInputParsed = z.infer<
  typeof workingHoursUpdateInputSchema
>;
