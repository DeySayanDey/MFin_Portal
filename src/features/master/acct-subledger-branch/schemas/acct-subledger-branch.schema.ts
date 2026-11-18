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

export const acctSubledgerBranchDtoSchema = z.object({
  id: z.coerce.number().int().positive(),
  branch_id: z.coerce.number().int().positive(),
  branch_code: nullableText,
  branch_name: nullableText,
  subledg_id: z.coerce.number().int().positive(),
  subledg_code: nullableText,
  subledg_name: nullableText,
  ledger_id: z.coerce.number().int().positive().nullable().optional(),
  ledger_code: nullableText,
  ledger_name: nullableText,
  is_active: boolish,
  created_by: z.coerce.number().int().nullable().optional(),
  created_at: nullableText,
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

export const acctSubledgerBranchCreateInputSchema = z.object({
  branchId: z.number().int().positive({ message: "Branch is required" }),
  subledgId: z.number().int().positive({ message: "Subledger is required" }),
  isActive: z.boolean().optional(),
});

export const acctSubledgerBranchUpdateInputSchema =
  acctSubledgerBranchCreateInputSchema.extend({
    id: z.number().int().positive({ message: "Mapping is required" }),
  });

export type AcctSubledgerBranchCreateInputParsed = z.infer<
  typeof acctSubledgerBranchCreateInputSchema
>;
export type AcctSubledgerBranchUpdateInputParsed = z.infer<
  typeof acctSubledgerBranchUpdateInputSchema
>;
