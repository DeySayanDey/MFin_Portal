import { z } from "zod";
import {
  hhmmToMinutes,
  isValidHhmm,
} from "@/features/master/working-hours/utils/time-format";

const hhmmSchema = z
  .string()
  .trim()
  .refine(isValidHhmm, { message: "Time must be HH:mm" });

/** Loose runtime check for WorkingHoursGet / Update response data. */
export const workingHoursDtoSchema = z.object({
  timing_id: z.number(),
  opening_time: z.string(),
  closing_time: z.string(),
  session_timeout_min: z.number(),
  working_days_desc: z.string().nullable().optional(),
  allow_sunday_login: z.boolean(),
  lockout_holidays: z.boolean(),
  allow_offline_collection: z.boolean(),
  updated_by: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Domain update validation — documented rules only.
 * Times must already be normalized to HH:mm before validation.
 */
export const workingHoursUpdateInputSchema = z
  .object({
    openingTime: hhmmSchema,
    closingTime: hhmmSchema,
    sessionTimeoutMin: z
      .number()
      .int()
      .min(1, "Session timeout must be at least 1 minute")
      .max(1440, "Session timeout must be at most 1440 minutes"),
    workingDaysDesc: z.string().nullable().optional(),
    allowSundayLogin: z.boolean().optional(),
    lockoutHolidays: z.boolean().optional(),
    allowOfflineCollection: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const openMins = hhmmToMinutes(value.openingTime);
    const closeMins = hhmmToMinutes(value.closingTime);
    if (openMins == null || closeMins == null) return;
    if (closeMins <= openMins) {
      ctx.addIssue({
        code: "custom",
        path: ["closingTime"],
        message: "Closing time must be later than opening time",
      });
    }
  });

export type WorkingHoursUpdateInputParsed = z.infer<
  typeof workingHoursUpdateInputSchema
>;
