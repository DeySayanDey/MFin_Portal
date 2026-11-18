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

const num = z.preprocess(asNumber, z.number().nullable()).nullish();
const int = z.preprocess(asNumber, z.number().int().nullable()).nullish();
const id = z.preprocess(asNumber, z.number().int().positive());
const text = z.union([z.string(), z.number()]).nullish();
const flag = z.preprocess(asBoolean, z.boolean().nullable()).nullish();

/** A list where malformed rows are dropped instead of failing the whole response. */
function rows<T extends z.ZodType>(item: T) {
  return z.unknown().transform((value): z.output<T>[] =>
    Array.isArray(value)
      ? value.flatMap((entry) => {
          const parsed = item.safeParse(entry);
          return parsed.success ? [parsed.data] : [];
        })
      : [],
  );
}

export const member360ProfileDtoSchema = z
  .object({
    member_id: id,
    member_code: text,
    ref_code: text,
    member_name: text,
    father_name: text,
    spouse_name: text,
    gender_desc: text,
    date_of_birth: text,
    age: int,
    mobile_no: text,
    alternate_mobile_no: text,
    email_id: text,
    pan_masked: text,
    address: text,
    branch_id: int,
    branch_name: text,
    center_name: text,
    fo_name: text,
    joining_date: text,
    occupation: text,
    monthly_income: num,
    status_cd: int,
    status_desc: text,
  })
  .passthrough();

const kycDtoSchema = z
  .object({
    member_kyc_id: id,
    doc_type_desc: text,
    kyc_no_masked: text,
    verify_status: int,
    expiry_date: text,
    is_expired: flag,
  })
  .passthrough();

const groupDtoSchema = z
  .object({
    group_id: id,
    group_code: text,
    group_name: text,
    member_role: text,
    join_date: text,
    exit_date: text,
    is_active: flag,
  })
  .passthrough();

const nomineeDtoSchema = z
  .object({
    nominee_name: text,
    relation_desc: text,
    share_percent: num,
  })
  .passthrough();

const sharesDtoSchema = z
  .object({
    total_shares: int,
    face_value: num,
    total_amount: num,
    paid_amount: num,
    pending_shares: int,
    last_subscription_date: text,
  })
  .passthrough();

const depositDtoSchema = z
  .object({
    account_id: id,
    deposit_type_cd: int,
    full_account_no: text,
    appl_no: text,
    scheme_name: text,
    holder_role: text,
    open_date: text,
    balance: num,
    maturity_date: text,
    maturity_amt: num,
    status_cd: int,
    status_desc: text,
    is_closed: flag,
  })
  .passthrough();

const loanDtoSchema = z
  .object({
    loan_account_id: id,
    loan_account_no: text,
    application_no: text,
    scheme_name: text,
    borrower_role: text,
    group_name: text,
    loan_date: text,
    loan_amount: num,
    disbursed_amount: num,
    principal_outstanding: num,
    overdue_amount: num,
    overdue_days: int,
    next_due_date: text,
    next_due_amount: num,
    status_cd: int,
    status_desc: text,
    is_closed: flag,
    is_npa: flag,
  })
  .passthrough();

const applicationDtoSchema = z
  .object({
    application_id: id,
    application_no: text,
    application_date: text,
    scheme_name: text,
    appl_amount: num,
    status_desc: text,
  })
  .passthrough();

const activityDtoSchema = z
  .object({
    module: z.enum(["savings", "term", "loan", "share"]),
    ref_id: z.union([z.string(), z.number()]),
    trans_date: text,
    reference: text,
    description: text,
    credit_amount: num,
    debit_amount: num,
  })
  .passthrough();

export const member360DtoSchema = z
  .object({
    profile: member360ProfileDtoSchema,
    kyc: rows(kycDtoSchema),
    groups: rows(groupDtoSchema),
    nominees: rows(nomineeDtoSchema),
    shares: sharesDtoSchema.nullish(),
    deposits: rows(depositDtoSchema),
    loans: rows(loanDtoSchema),
    applications: rows(applicationDtoSchema),
    activity: rows(activityDtoSchema),
  })
  .passthrough();

export type Member360Dto = z.infer<typeof member360DtoSchema>;
export type Member360ProfileDto = z.infer<typeof member360ProfileDtoSchema>;
export type Member360DepositDto = z.infer<typeof depositDtoSchema>;
export type Member360LoanDto = z.infer<typeof loanDtoSchema>;
