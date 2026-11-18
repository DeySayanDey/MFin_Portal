import { z } from "zod";

export const depositSchemeSlabDtoSchema = z.object({
  id: z.number(),
  scheme_id: z.number(),
  scheme_code: z.string().nullable().optional(),
  scheme_name: z.string().nullable().optional(),
  min_duration: z.number(),
  max_duration: z.number(),
  term_cd: z.number(),
  term_desc: z.string().nullable().optional(),
  roi: z.union([z.number(), z.string()]),
  lock_period: z.number().nullable().optional(),
  effect_frm: z.string(),
  effect_upto: z.string().nullable().optional(),
  is_active: z.union([z.boolean(), z.number()]).transform((v) => Boolean(v)),
  created_by: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const depositSchemeSlabListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().max(200).optional(),
  id: z.number().int().positive().optional(),
  schemeId: z.number().int().positive().optional(),
  termCd: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  effectiveOn: z.string().optional(),
  isActive: z.number().int().min(0).max(1).optional(),
  search: z.string().optional(),
});

export const depositSchemeSlabSaveInputSchema = z
  .object({
    id: z.number().int().positive().optional(),
    schemeId: z.number().int().positive({ message: "Scheme is required" }),
    minDuration: z.number().int().min(1, { message: "Min duration must be at least 1" }),
    maxDuration: z.number().int().min(1, { message: "Max duration is required" }),
    termCd: z.number().int().positive({ message: "Term is required" }),
    roi: z
      .number()
      .min(0, "ROI cannot be negative")
      .max(100, "ROI cannot exceed 100"),
    lockPeriod: z.number().int().min(0).nullable().optional(),
    effectFrm: z.string().min(1, "Effective from is required"),
    effectUpto: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => data.maxDuration >= data.minDuration,
    {
      message: "Max duration must be greater than or equal to min duration",
      path: ["maxDuration"],
    },
  )
  .refine(
    (data) => {
      if (!data.effectUpto || !data.effectFrm) return true;
      return data.effectUpto >= data.effectFrm;
    },
    {
      message: "Effective upto date must be on or after effective from date",
      path: ["effectUpto"],
    },
  );
