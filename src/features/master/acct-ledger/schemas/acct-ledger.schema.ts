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

export const acctLedgerDtoSchema = z.object({
  ledger_id: z.coerce.number().int().positive(),
  ledger_code: z.string(),
  ledger_name: z.string(),
  ledger_type: z.union([z.string(), z.number(), z.null()]).optional().transform((value) => value == null || String(value).trim() === "" ? null : String(value).trim()),
  adjustable_eligible: boolish.nullable().optional(),
  mainhd_id: z.coerce.number().int().positive(),
  mainhd_code: nullableText,
  mainhd_name: nullableText,
  categ_id: z.coerce.number().int().positive().nullable().optional(),
  categ_code: nullableText,
  categ_name: nullableText,
  is_active: boolish,
  created_by: z.coerce.number().int().nullable().optional(),
  created_at: nullableText,
  subledger_count: z.coerce.number().int().nonnegative().nullable().optional(),
});

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  last_page: z.number(),
  has_more: z.boolean(),
});

const ledgerCodeSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  })
  .refine((value) => value == null || value.length <= 50, {
    message: "Ledger code must be at most 50 characters",
  });

const ledgerTypeSchema = z
  .union([z.string(), z.number().int().positive(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    if (typeof value === "number") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  })
  .refine((value) => value == null || typeof value === "number" || value.length <= 50, {
    message: "Ledger type is invalid",
  });

export const acctLedgerCreateInputSchema = z.object({
  ledgerName: z
    .string()
    .trim()
    .min(1, { message: "Ledger name is required" })
    .max(150, { message: "Ledger name must be at most 150 characters" }),
  mainhdId: z.number().int().positive({ message: "Main head is required" }),
  ledgerCode: ledgerCodeSchema,
  ledgerType: ledgerTypeSchema,
  isActive: z.boolean().optional(),
});

export const acctLedgerUpdateInputSchema = acctLedgerCreateInputSchema.extend({
  ledgerId: z.number().int().positive({ message: "Ledger is required" }),
});

export type AcctLedgerCreateInputParsed = z.infer<
  typeof acctLedgerCreateInputSchema
>;
export type AcctLedgerUpdateInputParsed = z.infer<
  typeof acctLedgerUpdateInputSchema
>;
