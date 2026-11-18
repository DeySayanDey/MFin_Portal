import { z } from "zod";

const ymdSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" });

const boolish = z.union([z.boolean(), z.literal(0), z.literal(1)]).transform(
  (value) => value === true || value === 1,
);

export const finYearDtoSchema = z.object({
  year_id: z.coerce.number(),
  year_name: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  is_active: boolish,
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

export const finYearSaveInputSchema = z
  .object({
    yearId: z.number().int().positive().optional(),
    yearName: z
      .string()
      .trim()
      .min(1, { message: "Year name is required" })
      .max(25, { message: "Year name must be at most 25 characters" }),
    startDate: ymdSchema,
    endDate: ymdSchema,
    isActive: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate <= value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after start date",
      });
    }
  });

export type FinYearSaveInputParsed = z.infer<typeof finYearSaveInputSchema>;
