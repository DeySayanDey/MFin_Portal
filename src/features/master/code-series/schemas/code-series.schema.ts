import { z } from "zod";

export const codeSeriesDtoSchema = z.object({
  series_id: z.number(),
  module_key: z.string(),
  module_name: z.string(),
  prefix: z.string(),
  next_counter: z.number(),
  padding_digits: z.number(),
  suffix: z.string().nullable().optional(),
  gen_code: z.string().optional(),
  formatted_sample: z.string(),
  status: z.number(),
  created_by: z.number().nullable().optional(),
  /** @deprecated Prefer `created_by` — kept optional for older payloads. */
  updated_by: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

/** Documented update validation only. */
export const codeSeriesUpdateInputSchema = z.object({
  seriesId: z.number().int().positive(),
  nextCounter: z.number().int().min(1, "Next counter must be at least 1"),
  paddingDigits: z
    .number()
    .int()
    .min(1, "Padding must be at least 1")
    .max(12, "Padding must be at most 12"),
  prefix: z.string().trim().max(50).optional(),
  suffix: z.string().trim().max(20).optional(),
  status: z.number().int().min(0).max(1).optional(),
});

export type CodeSeriesUpdateInputParsed = z.infer<
  typeof codeSeriesUpdateInputSchema
>;
