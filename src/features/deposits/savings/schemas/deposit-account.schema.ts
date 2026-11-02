import { z } from "zod";

function asNumber(value: unknown): unknown {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}

function asBoolean(value: unknown): unknown {
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return value;
}

const requiredInt = z.preprocess(asNumber, z.number().int());
const optionalInt = z.preprocess(asNumber, z.number().int().nullable());
const optionalNumber = z.preprocess(asNumber, z.number().nullable());
const optionalBoolean = z.preprocess(asBoolean, z.boolean());

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const paginationMetaDtoSchema = z.object({
  total: z.preprocess(asNumber, z.number()),
  page: z.preprocess(asNumber, z.number()).optional(),
  per_page: z.preprocess(asNumber, z.number()).optional(),
  last_page: z.preprocess(asNumber, z.number()).optional(),
  has_more: z.preprocess(asBoolean, z.boolean()).optional(),
});

export const depositAccountDtoSchema = z.object({
  account_id: requiredInt,
  appl_no: z.string().nullish(),
  appl_date: z.string(),
  deposit_type_cd: requiredInt,
  deposit_type_desc: z.string().nullish(),
  scheme_id: requiredInt,
  scheme_code: z.string().nullish(),
  scheme_name: z.string().nullish(),
  scheme_roi_percent: optionalNumber.nullish(),
  special_catg_cd: optionalInt.nullish(),
  special_catg_desc: z.string().nullish(),
  cust_type_cd: requiredInt,
  cust_type_desc: z.string().nullish(),
  cust_id_primary: requiredInt,
  primary_ref_code: z.string().nullish(),
  primary_name: z.string().nullish(),
  primary_mobile: z.string().nullish(),
  cust_id_joint1: optionalInt.nullish(),
  joint1_ref_code: z.string().nullish(),
  joint1_name: z.string().nullish(),
  cust_id_joint2: optionalInt.nullish(),
  joint2_ref_code: z.string().nullish(),
  joint2_name: z.string().nullish(),
  holder_name: z.string().nullish(),
  op_mode_cd: requiredInt,
  op_mode_desc: z.string().nullish(),
  nom_regd: optionalBoolean.nullish(),
  nominee_count: optionalInt.nullish(),
  signatory_count: optionalInt.nullish(),
  account_no: optionalInt.nullish(),
  full_account_no: z.string().nullish(),
  prod_type_cd: optionalInt.nullish(),
  prod_type_desc: z.string().nullish(),
  member_count: optionalInt.nullish(),
  ref_ac_no: z.string().nullish(),
  start_date: z.string().nullish(),
  current_balance: optionalNumber.nullish(),
  closing_date: z.string().nullish(),
  closing_reason: z.string().nullish(),
  is_closed: optionalBoolean.nullish(),
  fo_id: optionalInt.nullish(),
  fo_code: z.string().nullish(),
  fo_name: z.string().nullish(),
  branch_id: optionalInt.nullish(),
  branch_code: z.string().nullish(),
  branch_name: z.string().nullish(),
  status_cd: requiredInt,
  status_desc: z.string().nullish(),
  is_active: optionalBoolean.nullish(),
  created_by: optionalInt.nullish(),
  created_by_name: z.string().nullish(),
  created_at: z.string().nullish(),
  sb: z
    .object({
      start_date: z.string().nullish(),
      account_no: optionalInt.nullish(),
      ref_ac_no: z.string().nullish(),
      cbs_ac_no: z.string().nullish(),
      roi: optionalNumber.nullish(),
      opening_deposit: optionalNumber.nullish(),
      current_balance: optionalNumber.nullish(),
      available_balance: optionalNumber.nullish(),
    })
    .nullish(),
  td: z
    .object({
      start_date: z.string().nullish(),
      account_no: optionalInt.nullish(),
      ref_ac_no: z.string().nullish(),
      period_yy: optionalInt.nullish(),
      period_mm: optionalInt.nullish(),
      period_dd: optionalInt.nullish(),
      roi: optionalNumber.nullish(),
      inst_no: optionalInt.nullish(),
      inst_amount: optionalNumber.nullish(),
      maturity_date: z.string().nullish(),
      maturity_amt: optionalNumber.nullish(),
      intt_payable_amt: optionalNumber.nullish(),
      matu_ins_desc: z.string().nullish(),
      current_balance: optionalNumber.nullish(),
    })
    .nullish(),
});

const optionalText = (max: number) =>
  z.preprocess((value) => {
    if (value == null) return value;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().max(max).nullable().optional());

const sbInputSchema = z.object({
  startDate: ymd.nullable().optional(),
  accountNo: z.number().int().min(1).max(32767).nullable().optional(),
  refAcNo: optionalText(15),
  cbsAcNo: optionalText(25),
  roi: z.number().min(0).max(100).nullable().optional(),
  openingDeposit: z.number().min(0).nullable().optional(),
});

export const depositAccountCreateSchema = z.object({
  applDate: ymd,
  schemeId: z.number().int().positive(),
  custTypeCd: z.number().int().positive(),
  custIdPrimary: z.number().int().positive(),
  opModeCd: z.number().int().positive(),
  applNo: optionalText(25),
  specialCatgCd: z.number().int().positive().nullable().optional(),
  custIdJoint1: z.number().int().positive().nullable().optional(),
  custIdJoint2: z.number().int().positive().nullable().optional(),
  holderName: optionalText(300),
  nomRegd: z.boolean().optional(),
  foId: z.number().int().positive().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
  statusCd: z.union([z.literal(1), z.literal(7)]).optional(),
  sb: sbInputSchema.optional(),
});

export const depositAccountEditSchema = z.object({
  accountId: z.number().int().positive(),
  applDate: ymd.optional(),
  schemeId: z.number().int().positive().optional(),
  custTypeCd: z.number().int().positive().optional(),
  custIdPrimary: z.number().int().positive().optional(),
  opModeCd: z.number().int().positive().optional(),
  applNo: optionalText(25),
  specialCatgCd: z.number().int().positive().nullable().optional(),
  custIdJoint1: z.number().int().positive().nullable().optional(),
  custIdJoint2: z.number().int().positive().nullable().optional(),
  holderName: optionalText(300),
  nomRegd: z.boolean().optional(),
  foId: z.number().int().positive().nullable().optional(),
  branchId: z.number().int().positive().nullable().optional(),
  sb: sbInputSchema.optional(),
});

export const depositAccountStatusSchema = z.object({
  accountId: z.number().int().positive(),
  statusCd: z.number().int().positive(),
});

export const depositAccountCloseSchema = z.object({
  accountId: z.number().int().positive(),
  closingReason: z.string().trim().min(1).max(250),
  closingDate: ymd.optional(),
});

const nomineeItemSchema = z.object({
  nomCustId: z.number().int().positive().nullable().optional(),
  nomName: z.string().trim().max(120).nullable().optional(),
  relationCd: z.number().int().positive(),
  contactNo: z.string().trim().max(10).nullable().optional(),
  birthDate: ymd.nullable().optional(),
  age: z.number().int().min(0).max(120).nullable().optional(),
  address: z.string().trim().max(150).nullable().optional(),
  guardianName: z.string().trim().max(100).nullable().optional(),
  sharePercent: z.number().positive().max(100).nullable().optional(),
});

export const depositNomineeAddSchema = z.object({
  accountId: z.number().int().positive(),
  nominees: z.array(nomineeItemSchema).min(1).max(4),
});

export const depositNomineeDtoSchema = z.object({
  nominee_id: requiredInt,
  account_id: requiredInt,
  nom_cust_id: optionalInt.nullish(),
  nom_cust_ref_code: z.string().nullish(),
  nom_name: z.string().nullish(),
  contact_no: z.string().nullish(),
  relation_cd: requiredInt,
  relation_desc: z.string().nullish(),
  age: optionalInt.nullish(),
  birth_date: z.string().nullish(),
  address: z.string().nullish(),
  guardian_name: z.string().nullish(),
  share_percent: optionalNumber.nullish(),
  is_active: optionalBoolean.nullish(),
});

export const depositNomineeEditSchema = z.object({
  nomineeId: z.number().int().positive(),
  nomCustId: z.number().int().positive().nullable().optional(),
  nomName: z.string().trim().max(120).nullable().optional(),
  relationCd: z.number().int().positive().optional(),
  contactNo: z.string().trim().max(10).nullable().optional(),
  birthDate: ymd.nullable().optional(),
  age: z.number().int().min(0).max(120).nullable().optional(),
  address: z.string().trim().max(150).nullable().optional(),
  guardianName: z.string().trim().max(100).nullable().optional(),
  sharePercent: z.number().positive().max(100).nullable().optional(),
});

export const depositNomineeStatusSchema = z.object({
  nomineeId: z.number().int().positive(),
  isActive: z.boolean(),
});

const signatoryItemSchema = z.object({
  custId: z.number().int().positive(),
  signFileNm: z.string().trim().max(75).nullable().optional(),
  photoFileNm: z.string().trim().max(75).nullable().optional(),
});

export const depositSignatoryAddSchema = z.object({
  accountId: z.number().int().positive(),
  signatories: z.array(signatoryItemSchema).min(1).max(10),
});

export const depositSignatoryDtoSchema = z.object({
  signatory_id: requiredInt,
  account_id: requiredInt,
  cust_id: requiredInt,
  cust_ref_code: z.string().nullish(),
  cust_name: z.string().nullish(),
  cust_mobile: z.string().nullish(),
  signatory_role: z.string().nullish(),
  sign_file_nm: z.string().nullish(),
  photo_file_nm: z.string().nullish(),
  is_active: optionalBoolean.nullish(),
});

export const depositSignatoryEditSchema = z.object({
  signatoryId: z.number().int().positive(),
  signFileNm: z.string().trim().max(75).nullable().optional(),
  photoFileNm: z.string().trim().max(75).nullable().optional(),
});

export const depositSignatoryStatusSchema = z.object({
  signatoryId: z.number().int().positive(),
  isActive: z.boolean(),
});
