import { z } from "zod";
import {
  hhmmToMinutes,
  isValidHhmm,
} from "@/features/master/working-hours/utils/time-format";

const boolish = z
  .union([
    z.boolean(),
    z.literal(0),
    z.literal(1),
    z.literal("0"),
    z.literal("1"),
  ])
  .transform((value) => value === true || value === 1 || value === "1");

const nullableText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  });

const hhmmOptional = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  })
  .refine((value) => value == null || isValidHhmm(value), {
    message: "Time must be HH:mm (24-hour)",
  });

export const operationalDayDtoSchema = z.object({
  rec_id: z.coerce.number(),
  branch_id: z.coerce.number(),
  branch_code: nullableText,
  branch_name: nullableText,
  day_of_week: z.coerce.number().int().min(1).max(7),
  day_name: nullableText,
  is_operational: boolish,
  is_half_day: boolish,
  open_time: nullableText,
  close_time: nullableText,
  is_active: boolish,
  created_by: z.coerce.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

const operationalDayWritableSchema = z.object({
  branchId: z.number().int().positive({ message: "Branch is required" }),
  dayOfWeek: z
    .number()
    .int()
    .min(1, { message: "Day of week is required" })
    .max(7, { message: "Day of week must be 1–7" }),
  isOperational: z.boolean().optional(),
  isHalfDay: z.boolean().optional(),
  openTime: hhmmOptional,
  closeTime: hhmmOptional,
  isActive: z.boolean().optional(),
});

function refineTimes(
  value: {
    isOperational?: boolean;
    openTime?: string | null;
    closeTime?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  const operational = value.isOperational !== false;
  if (!operational) return;
  if (value.openTime == null || value.closeTime == null) return;
  const openMins = hhmmToMinutes(value.openTime);
  const closeMins = hhmmToMinutes(value.closeTime);
  if (openMins == null || closeMins == null) return;
  if (closeMins <= openMins) {
    ctx.addIssue({
      code: "custom",
      path: ["closeTime"],
      message: "Close time must be after open time",
    });
  }
}

export const operationalDayCreateInputSchema =
  operationalDayWritableSchema.superRefine(refineTimes);

export const operationalDayUpdateInputSchema = operationalDayWritableSchema
  .extend({
    recId: z.number().int().positive(),
  })
  .superRefine(refineTimes);

export const operationalDaysBulkInputSchema = operationalDayWritableSchema
  .omit({ dayOfWeek: true })
  .extend({
    branchId: z.number().int().positive().max(32767),
    days: z.array(z.object({
      dayOfWeek: z.number().int().min(1).max(7),
      recId: z.number().int().positive().max(65535).nullable().optional(),
    }).strict()).min(1).max(7),
  })
  .superRefine((value, ctx) => {
    refineTimes(value, ctx);
    const weekdays = new Set<number>();
    const ids = new Set<number>();
    value.days.forEach((item, index) => {
      if (weekdays.has(item.dayOfWeek)) ctx.addIssue({ code: "custom", path: ["days", index, "dayOfWeek"], message: "Duplicate weekday" });
      weekdays.add(item.dayOfWeek);
      if (item.recId != null) {
        if (ids.has(item.recId)) ctx.addIssue({ code: "custom", path: ["days", index, "recId"], message: "Duplicate record ID" });
        ids.add(item.recId);
      }
    });
  });

export type OperationalDayCreateInputParsed = z.infer<
  typeof operationalDayCreateInputSchema
>;
export type OperationalDayUpdateInputParsed = z.infer<
  typeof operationalDayUpdateInputSchema
>;
