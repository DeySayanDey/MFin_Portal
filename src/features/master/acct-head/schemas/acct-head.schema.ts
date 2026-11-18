import { z } from "zod";

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

export const acctHeadDtoSchema = z.object({
  mainhd_id: z.coerce.number().int().positive(),
  mainhd_code: z.string(),
  mainhd_name: z.string(),
  categ_id: z.coerce.number().int().positive(),
  categ_code: nullableText,
  categ_name: nullableText,
  categy_type: nullableText,
  is_active: boolish,
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

const mainhdCodeSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  })
  .refine((value) => value == null || value.length <= 50, {
    message: "Head code must be at most 50 characters",
  });

export const acctHeadCreateInputSchema = z.object({
  mainhdName: z
    .string()
    .trim()
    .min(1, { message: "Head name is required" })
    .max(150, { message: "Head name must be at most 150 characters" }),
  categId: z.number().int().positive({ message: "Category is required" }),
  mainhdCode: mainhdCodeSchema,
  isActive: z.boolean().optional(),
});

export const acctHeadUpdateInputSchema = acctHeadCreateInputSchema.extend({
  mainhdId: z.number().int().positive({ message: "Main head is required" }),
});

export type AcctHeadCreateInputParsed = z.infer<
  typeof acctHeadCreateInputSchema
>;
export type AcctHeadUpdateInputParsed = z.infer<
  typeof acctHeadUpdateInputSchema
>;
