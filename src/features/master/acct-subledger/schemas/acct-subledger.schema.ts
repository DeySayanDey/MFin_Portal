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

export const acctSubledgerDtoSchema = z.object({
  subledg_id: z.coerce.number().int().positive(),
  subledg_code: z.string(),
  subledg_name: z.string(),
  ledger_id: z.coerce.number().int().positive(),
  ledger_code: nullableText,
  ledger_name: nullableText,
  mainhd_id: z.coerce.number().int().positive().nullable().optional(),
  mainhd_code: nullableText,
  mainhd_name: nullableText,
  is_active: boolish,
  created_by: z.coerce.number().int().nullable().optional(),
  created_at: nullableText,
  branch_count: z.coerce.number().int().nonnegative().nullable().optional(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

const subledgCodeSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  })
  .refine((value) => value == null || value.length <= 50, {
    message: "Subledger code must be at most 50 characters",
  });

export const acctSubledgerCreateInputSchema = z.object({
  subledgName: z
    .string()
    .trim()
    .min(1, { message: "Subledger name is required" })
    .max(100, { message: "Subledger name must be at most 100 characters" }),
  ledgerId: z.number().int().positive({ message: "Ledger is required" }),
  subledgCode: subledgCodeSchema,
  isActive: z.boolean().optional(),
});

export const acctSubledgerUpdateInputSchema =
  acctSubledgerCreateInputSchema.extend({
    subledgId: z
      .number()
      .int()
      .positive({ message: "Subledger is required" }),
  });

export type AcctSubledgerCreateInputParsed = z.infer<
  typeof acctSubledgerCreateInputSchema
>;
export type AcctSubledgerUpdateInputParsed = z.infer<
  typeof acctSubledgerUpdateInputSchema
>;
