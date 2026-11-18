import { z } from "zod";

export const paginationMetaDtoSchema = z.object({
  total: z.number(),
  page: z.number().optional(),
  per_page: z.number().optional(),
  last_page: z.number().optional(),
  has_more: z.boolean().optional(),
});

export const depositSchemeDtoSchema = z.object({
  scheme_id: z.number(),
  scheme_code: z.string().default(""),
  scheme_name: z.string(),
  deposit_type_cd: z.number(),
  deposit_type_desc: z.string().nullable().optional(),
  prod_type_cd: z.number(),
  prod_type_desc: z.string().nullable().optional(),
  roi_percent: z.number().nullable().optional(),
  intt_type_cd: z.number().nullable().optional(),
  intt_type_desc: z.string().nullable().optional(),
  intt_payout_cd: z.number().nullable().optional(),
  intt_payout_desc: z.string().nullable().optional(),
  min_balance: z.number().nullable().optional(),
  withd_allow: z.boolean().nullable().optional(),
  max_withd_amt: z.number().nullable().optional(),
  inop_days: z.number().nullable().optional(),
  prn_ledger: z.number().nullable().optional(),
  prn_ledger_code: z.string().nullable().optional(),
  prn_ledger_name: z.string().nullable().optional(),
  prn_ledger_type: z.union([z.string(), z.number()]).nullable().optional(),
  prn_ledger_mainhd_id: z.number().nullable().optional(),
  prn_ledger_mainhd_name: z.string().nullable().optional(),
  prn_ledger_is_active: z.boolean().nullable().optional(),
  intt_ledg: z.number().nullable().optional(),
  intt_ledger_code: z.string().nullable().optional(),
  intt_ledger_name: z.string().nullable().optional(),
  intt_ledger_type: z.union([z.string(), z.number()]).nullable().optional(),
  intt_ledger_mainhd_id: z.number().nullable().optional(),
  intt_ledger_mainhd_name: z.string().nullable().optional(),
  intt_ledger_is_active: z.boolean().nullable().optional(),
  field_coll: z.boolean().nullable().optional(),
  is_active: z.boolean().default(true),
  created_by: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_by: z.number().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const depositSchemeSetupSaveInputSchema = z
  .object({
    schemeId: z.number().optional(),
    schemeName: z.string().trim().min(1, "Scheme Name is required").max(100),
    depositTypeCd: z.number().int().positive("Deposit Type is required"),
    prodTypeCd: z.number().int().positive("Product Type is required"),
    roiPercent: z.number().min(0).max(100).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6).nullable().optional(),
    inttTypeCd: z.number().int().positive().nullable().optional(),
    inttPayoutCd: z.number().int().positive().nullable().optional(),
    minBalance: z.number().min(0).max(999999.99).nullable().optional(),
    withdAllow: z.boolean().optional().default(false),
    maxWithdAmt: z.number().min(0).max(999999.99).nullable().optional(),
    inopDays: z.number().int().min(0).max(32767).nullable().optional(),
    prnLedger: z.number().int().positive().nullable().optional(),
    inttLedg: z.number().int().positive().nullable().optional(),
    fieldColl: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.withdAllow && data.maxWithdAmt != null) {
        return data.maxWithdAmt >= 0;
      }
      return true;
    },
    {
      message: "Max Withdrawal amount must be valid when withdrawal is allowed",
      path: ["maxWithdAmt"],
    },
  )
  .refine(
    (data) => {
      if (data.prnLedger && data.inttLedg) {
        return data.prnLedger !== data.inttLedg;
      }
      return true;
    },
    {
      message: "Principal ledger and interest ledger must be different",
      path: ["inttLedg"],
    },
  );

export const depositSchemeChargeSaveInputSchema = z
  .object({
    schemeId: z.number().int().positive(),
    chargesIds: z.array(z.number().int().positive()),
    mode: z.enum(["create", "edit"]),
  })
  .refine((data) => data.mode === "edit" || data.chargesIds.length > 0, {
    message: "Select at least one charge",
    path: ["chargesIds"],
  });
