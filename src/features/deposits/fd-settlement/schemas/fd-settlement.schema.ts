import { z } from "zod";

function asNumber(value: unknown): unknown {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

function asBoolean(value: unknown): unknown {
  if (value === 1 || value === "1" || value === "true" || value === "Y") return true;
  if (value === 0 || value === "0" || value === "false" || value === "N") return false;
  return value;
}

function asCodeList(value: unknown): unknown {
  if (value == null || value === "") return [];
  if (typeof value === "string") return value.split(",").map((item) => item.trim());
  return value;
}

const optionalNumber = z.preprocess(asNumber, z.number().nullable()).nullish();
const optionalInt = z.preprocess(asNumber, z.number().int().nullable()).nullish();
const requiredInt = z.preprocess(asNumber, z.number().int());
const optionalText = z.string().nullish();
const optionalBoolean = z.preprocess(asBoolean, z.boolean().nullable()).nullish();
const codeList = z.preprocess(asCodeList, z.array(z.preprocess(asNumber, z.number().int())));
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const misDtoSchema = z
  .object({
    monthly_interest: optionalNumber,
    last_paid_date: optionalText,
    total_interest_paid: optionalNumber,
    unpaid_installments: optionalInt,
    pending_interest: optionalNumber,
    recoverable_excess: optionalNumber,
  })
  .passthrough();

export const settlementAccountDtoSchema = z
  .object({
    account_id: requiredInt,
    account_no: z.union([z.string(), z.number()]).nullish(),
    cust_id: optionalInt,
    cust_ref_code: optionalText,
    holder_name: optionalText,
    kyc_status: optionalText,
    op_mode_cd: optionalInt,
    branch_id: optionalInt,
    branch_name: optionalText,
    scheme_type: optionalText,
    scheme_name: optionalText,
    account_status: optionalText,
    principal_amount: optionalNumber,
    roi: optionalNumber,
    start_date: optionalText,
    maturity_date: optionalText,
    period_months: optionalInt,
    payout_type: optionalText,
    eligible: optionalBoolean,
    restriction: optionalText,
    permitted_types: codeList.nullish(),
    payment_methods: codeList.nullish(),
    sb_account_id: optionalInt,
    sb_account_no: z.union([z.string(), z.number()]).nullish(),
    sb_holder_name: optionalText,
    mis: misDtoSchema.nullish(),
  })
  .passthrough();

export const settlementQuoteDtoSchema = z
  .object({
    quote_id: optionalText,
    valid_till: optionalText,
    principal_amount: optionalNumber,
    interest_amount: optionalNumber,
    overdue_interest: optionalNumber,
    interest_recovery: optionalNumber,
    penalty_amount: optionalNumber,
    tds_amount: optionalNumber,
    other_deductions: optionalNumber,
    net_payable: optionalNumber,
  })
  .passthrough();

export const settlementRequestDtoSchema = settlementQuoteDtoSchema
  .extend({
    settlement_id: requiredInt,
    account_id: requiredInt,
    account_no: z.union([z.string(), z.number()]).nullish(),
    holder_name: optionalText,
    branch_name: optionalText,
    status_cd: requiredInt,
    settlement_type_cd: optionalInt,
    settlement_date: optionalText,
    reason_cd: optionalInt,
    remarks: optionalText,
    pay_mode_cd: optionalInt,
    beneficiary_account: optionalText,
    beneficiary_name: optionalText,
    ifsc: optionalText,
    cheque_ref: optionalText,
    document_name: optionalText,
    rejection_reason: optionalText,
    receipt_no: optionalText,
  })
  .passthrough();

export const settlementAccountDetailDtoSchema = z
  .object({
    account: settlementAccountDtoSchema,
    open_request: settlementRequestDtoSchema.nullish(),
    settled_request: settlementRequestDtoSchema.nullish(),
  })
  .passthrough();

export const paginationMetaDtoSchema = z.object({
  total: z.preprocess(asNumber, z.number()),
  page: z.preprocess(asNumber, z.number()).optional(),
  per_page: z.preprocess(asNumber, z.number()).optional(),
  last_page: z.preprocess(asNumber, z.number()).optional(),
});

const settlementType = z.enum(["maturity", "premature"]);

export const settlementCalculateSchema = z.object({
  accountId: z.number().int().positive(),
  settlementType,
  settlementDate: ymd,
});

const optionalField = (max: number) => z.string().trim().max(max).optional();

export const settlementSaveSchema = z
  .object({
    settlementId: z.number().int().positive().optional(),
    accountId: z.number().int().positive(),
    submit: z.boolean(),
    settlementType,
    settlementDate: ymd,
    reason: z.enum(["customer", "financial", "other"]),
    remarks: optionalField(250),
    paymentMode: z.enum(["savings", "neft", "cheque", "cash"]).optional(),
    sbAccountId: z.number().int().positive().optional(),
    beneficiaryAccount: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z-]{0,30}$/)
      .optional(),
    beneficiaryName: optionalField(100),
    ifsc: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^([A-Z]{4}0[A-Z0-9]{6})?$/)
      .optional(),
    chequeRef: optionalField(30),
    netPayable: z.number().nonnegative().optional(),
    quoteId: optionalField(60),
  })
  .superRefine((value, context) => {
    if (!value.submit) return;
    const need = (path: keyof typeof value, ok: boolean) => {
      if (!ok) context.addIssue({ code: "custom", path: [path], message: "Required" });
    };
    need("paymentMode", value.paymentMode != null);
    need("netPayable", value.netPayable != null);
    if (value.paymentMode === "savings") need("sbAccountId", value.sbAccountId != null);
    if (value.paymentMode === "neft") {
      need("beneficiaryAccount", Boolean(value.beneficiaryAccount));
      need("ifsc", Boolean(value.ifsc));
    }
    if (value.paymentMode === "cheque") need("chequeRef", Boolean(value.chequeRef));
  });

export const settlementActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), settlementId: z.number().int().positive() }),
  z.object({
    action: z.literal("reject"),
    settlementId: z.number().int().positive(),
    reason: z.string().trim().min(1).max(250),
  }),
  z.object({ action: z.literal("post"), settlementId: z.number().int().positive() }),
]);

export type SettlementAccountDto = z.infer<typeof settlementAccountDtoSchema>;
export type SettlementQuoteDto = z.infer<typeof settlementQuoteDtoSchema>;
export type SettlementRequestDto = z.infer<typeof settlementRequestDtoSchema>;
export type SettlementSaveValues = z.infer<typeof settlementSaveSchema>;
