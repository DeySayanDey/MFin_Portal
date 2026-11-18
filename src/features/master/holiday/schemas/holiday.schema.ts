import { z } from "zod";

const ymdSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" });

export const holidayDtoSchema = z.object({
  id: z.coerce.number(),
  year_sl: z.coerce.number(),
  year_name: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value == null || value === "" ? null : value)),
  holiday_date: z.string(),
  purpose: z.string(),
  holi_type: z.coerce.number(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

export const holidaySaveInputSchema = z
  .object({
    id: z.number().int().positive().optional(),
    yearSl: z.number().int().positive({ message: "Financial year is required" }),
    holidayDate: ymdSchema,
    purpose: z
      .string()
      .trim()
      .min(1, { message: "Purpose is required" })
      .max(100, { message: "Purpose must be at most 100 characters" }),
    holiType: z.number().int().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.holiType != null &&
      value.holiType !== 1 &&
      value.holiType !== 2
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["holiType"],
        message: "Holiday type must be National or Festival",
      });
    }
  });

export type HolidaySaveInputParsed = z.infer<typeof holidaySaveInputSchema>;
