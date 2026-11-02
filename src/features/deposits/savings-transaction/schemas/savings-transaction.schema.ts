import { z } from "zod";

function asNumber(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

const optionalNumber = z.preprocess(asNumber, z.number().nullable());
const optionalInt = z.preprocess(asNumber, z.number().int().nullable());
const requiredInt = z.preprocess(asNumber, z.number().int());
const optionalText = z.string().nullish();
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const savingsTransactionDtoSchema = z
  .object({
    trans_id: requiredInt,
    trans_no: optionalText,
    account_id: requiredInt,
    appl_no: optionalText,
    holder_name: optionalText,
    account_no: optionalInt.nullish(),
    deposit_type_cd: optionalInt.nullish(),
    deposit_type_desc: optionalText,
    scheme_code: optionalText,
    scheme_name: optionalText,
    trans_date: optionalText,
    effect_date: optionalText,
    trans_mode: optionalText,
    trans_mode_desc: optionalText,
    trans_type_cd: optionalInt.nullish(),
    trans_type_desc: optionalText,
    trans_amount: optionalNumber.nullish(),
    balance_after: optionalNumber.nullish(),
    ledger_narration: optionalText,
    branch_name: optionalText,
    fo_name: optionalText,
    remarks: optionalText,
    status_cd: optionalInt.nullish(),
    status_desc: optionalText,
    created_by: optionalInt.nullish(),
    created_by_name: optionalText,
    created_at: optionalText,
    approved_by_name: optionalText,
    approved_at: optionalText,
    voucher_id: optionalInt.nullish(),
    voucher_no: optionalText,
  })
  .passthrough();

export const savingsTransactionAddSchema = z.object({
  accountId: z.number().int().positive(),
  transTypeCd: z.union([z.literal(1), z.literal(2)]),
  transAmount: z.number().positive(),
  transMode: z.enum(["CA", "CQ", "TR", "OL"]).nullable().optional(),
  transDate: ymd.nullable().optional(),
  effectDate: ymd.nullable().optional(),
  foId: z.number().int().positive().nullable().optional(),
  ledgerNarration: z.string().trim().max(75).nullable().optional(),
  remarks: z.string().trim().max(250).nullable().optional(),
});

export const savingsTransactionApproveSchema = z
  .object({
    transId: z.number().int().positive(),
    approve: z.boolean(),
    remarks: z.string().trim().max(200).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (!value.approve && !value.remarks?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["remarks"],
        message: "Rejection reason is required",
      });
    }
  });

const optionalBoolean = z.preprocess((value) => {
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return value;
}, z.boolean().nullable());

export const savingsCustomerAccountSchema = z
  .object({
    account_id: requiredInt,
    full_account_no: optionalText,
    appl_no: optionalText,
    holder_name: optionalText,
    deposit_type_cd: optionalInt.nullish(),
    deposit_type_desc: optionalText,
    scheme_code: optionalText,
    scheme_name: optionalText,
    branch_id: optionalInt.nullish(),
    branch_name: optionalText,
    status_cd: optionalInt.nullish(),
    status_desc: optionalText,
    current_balance: optionalNumber.nullish(),
    available_balance: optionalNumber.nullish(),
  })
  .passthrough();

export const savingsCustomerDtoSchema = z
  .object({
    cust_type_cd: optionalInt.nullish(),
    cust_type_desc: optionalText,
    cust_id: requiredInt,
    name: optionalText,
    ref_code: optionalText,
    mobile_no: optionalText,
    member_id: optionalInt.nullish(),
    group_id: optionalInt.nullish(),
    accounts: z.array(savingsCustomerAccountSchema).nullish(),
  })
  .passthrough();

export const savingsAccountBalanceSchema = z
  .object({
    account_id: requiredInt,
    current_balance: optionalNumber.nullish(),
    available_balance: optionalNumber.nullish(),
    pending_count: optionalInt.nullish(),
    can_deposit: optionalBoolean.nullish(),
    can_withdraw: optionalBoolean.nullish(),
    withdrawable_amount: optionalNumber.nullish(),
    deposit_remaining: optionalNumber.nullish(),
    inst_amount: optionalNumber.nullish(),
    maturity_date: optionalText,
    start_date: optionalText,
    min_balance: optionalNumber.nullish(),
    vouchers_missing: optionalInt.nullish(),
    is_closed: optionalBoolean.nullish(),
    status_cd: optionalInt.nullish(),
    status_desc: optionalText,
  })
  .passthrough();

export const paginationMetaDtoSchema = z.object({
  total: z.preprocess(asNumber, z.number()),
  page: z.preprocess(asNumber, z.number()).optional(),
  per_page: z.preprocess(asNumber, z.number()).optional(),
  last_page: z.preprocess(asNumber, z.number()).optional(),
});
