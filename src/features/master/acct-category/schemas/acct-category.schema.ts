import { z } from "zod";

const nullableText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  });

export const acctCategoryDtoSchema = z.object({
  categ_id: z.coerce.number().int().positive(),
  categ_code: z.string(),
  categ_name: z.string(),
  categy_type: nullableText,
  head_count: z.coerce.number().int().nonnegative().nullable().optional(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

const categoryTypeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => value === "CR" || value === "DR", {
    message: "Category type is required",
  });

const categCodeSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  })
  .refine((value) => value == null || value.length <= 50, {
    message: "Category code must be at most 50 characters",
  });

export const acctCategoryCreateInputSchema = z.object({
  categName: z
    .string()
    .trim()
    .min(1, { message: "Category name is required" })
    .max(100, { message: "Category name must be at most 100 characters" }),
  categCode: categCodeSchema,
  categoryType: categoryTypeSchema,
});

export const acctCategoryUpdateInputSchema = acctCategoryCreateInputSchema.extend({
  categId: z.number().int().positive({ message: "Category is required" }),
});

export type AcctCategoryCreateInputParsed = z.infer<
  typeof acctCategoryCreateInputSchema
>;
export type AcctCategoryUpdateInputParsed = z.infer<
  typeof acctCategoryUpdateInputSchema
>;
