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

export const centerDtoSchema = z.object({
  center_id: z.coerce.number(),
  branch_id: z.coerce.number(),
  branch_code: nullableText,
  branch_name: nullableText,
  center_name: z.string(),
  center_address: nullableText,
  is_active: boolish,
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

export const centerCreateInputSchema = z.object({
  branchId: z.number().int().positive({ message: "Branch is required" }),
  centerName: z
    .string()
    .trim()
    .min(1, { message: "Center name is required" })
    .max(100, { message: "Center name must be at most 100 characters" }),
  centerAddress: z
    .string()
    .trim()
    .max(255, { message: "Address must be at most 255 characters" })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const centerUpdateInputSchema = centerCreateInputSchema.extend({
  centerId: z.number().int().positive(),
});

export type CenterCreateInputParsed = z.infer<typeof centerCreateInputSchema>;
export type CenterUpdateInputParsed = z.infer<typeof centerUpdateInputSchema>;
