import type { z } from "zod";
import type {
  depositOpeningTransactionDtoSchema,
  depositProductSchemeDtoSchema,
} from "../schemas/deposit-account.schema";
import type {
  DepositAccount,
  DepositAccountCloseInput,
  DepositAccountCreateInput,
  DepositAccountDto,
  DepositAccountEditInput,
  DepositAccountStatusInput,
  DepositOpeningTransaction,
  DepositProductScheme,
  DepositCustomer,
  DepositNominee,
  DepositNomineeAddInput,
  DepositNomineeEditInput,
  DepositNomineeStatusInput,
  DepositSignatory,
  DepositSignatoryAddInput,
  DepositSignatoryEditInput,
  DepositSignatoryStatusInput,
  SignatoryCandidate,
  PaginationMeta,
  PaginationMetaDto,
} from "../types/deposit-account.types";

function text(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function mapPaginationMetaDto(dto: PaginationMetaDto): PaginationMeta {
  const perPage = dto.per_page ?? 50;
  const currentPage = dto.page ?? 1;
  const lastPage = dto.last_page ?? (Math.ceil(dto.total / perPage) || 1);
  return {
    total: dto.total,
    perPage,
    currentPage,
    lastPage,
  };
}

export function mapDepositAccountDto(dto: DepositAccountDto): DepositAccount {
  return {
    accountId: dto.account_id,
    applNo: text(dto.appl_no),
    applDate: dto.appl_date,
    depositTypeCd: dto.deposit_type_cd,
    depositTypeDesc: text(dto.deposit_type_desc),
    schemeId: dto.scheme_id,
    schemeCode: text(dto.scheme_code),
    schemeName: text(dto.scheme_name),
    schemeRoiPercent: dto.scheme_roi_percent ?? null,
    specialCatgCd: dto.special_catg_cd ?? null,
    specialCatgDesc: text(dto.special_catg_desc),
    custTypeCd: dto.cust_type_cd,
    custTypeDesc: text(dto.cust_type_desc),
    custIdPrimary: dto.cust_id_primary,
    primaryRefCode: text(dto.primary_ref_code),
    primaryName: text(dto.primary_name),
    primaryMobile: dto.primary_mobile?.trim() || null,
    custIdJoint1: dto.cust_id_joint1 ?? null,
    joint1RefCode: text(dto.joint1_ref_code),
    joint1Name: text(dto.joint1_name),
    custIdJoint2: dto.cust_id_joint2 ?? null,
    joint2RefCode: text(dto.joint2_ref_code),
    joint2Name: text(dto.joint2_name),
    holderName: text(dto.holder_name),
    opModeCd: dto.op_mode_cd,
    opModeDesc: text(dto.op_mode_desc),
    nomRegd: dto.nom_regd === true,
    nomineeCount: dto.nominee_count ?? 0,
    signatoryCount: dto.signatory_count ?? 0,
    accountNo: dto.sb?.account_no ?? dto.td?.account_no ?? dto.account_no ?? null,
    fullAccountNo: dto.full_account_no?.trim() || null,
    prodTypeCd: dto.prod_type_cd ?? null,
    prodTypeDesc: text(dto.prod_type_desc),
    memberCount: dto.member_count ?? 0,
    refAcNo: (dto.sb?.ref_ac_no ?? dto.td?.ref_ac_no ?? dto.ref_ac_no)?.trim() || null,
    startDate: dto.sb?.start_date ?? dto.td?.start_date ?? dto.start_date ?? null,
    currentBalance:
      dto.sb?.current_balance ?? dto.td?.current_balance ?? dto.current_balance ?? null,
    availableBalance: dto.sb?.available_balance ?? null,
    closingDate: dto.closing_date ?? null,
    closingReason: dto.closing_reason?.trim() || null,
    isClosed: dto.is_closed === true || Boolean(dto.closing_date),
    foId: dto.fo_id ?? null,
    foCode: text(dto.fo_code),
    foName: text(dto.fo_name),
    branchId: dto.branch_id ?? null,
    branchCode: text(dto.branch_code),
    branchName: text(dto.branch_name),
    statusCd: dto.status_cd,
    statusDesc: text(dto.status_desc),
    isActive: dto.is_active === true,
    createdBy: dto.created_by ?? null,
    createdByName: text(dto.created_by_name),
    createdAt: dto.created_at ?? null,
    cbsAcNo: dto.sb?.cbs_ac_no?.trim() || null,
    openingDeposit: dto.sb?.opening_deposit ?? null,
    sbRoi: dto.sb?.roi ?? null,
    sbId: dto.sb?.sb_id ?? null,
    td: dto.td
      ? {
          startDate: dto.td.start_date ?? null,
          accountNo: dto.td.account_no ?? null,
          refAcNo: dto.td.ref_ac_no?.trim() || null,
          periodYy: dto.td.period_yy ?? null,
          periodMm: dto.td.period_mm ?? null,
          periodDd: dto.td.period_dd ?? null,
          roi: dto.td.roi ?? null,
          instNo: dto.td.inst_no ?? null,
          instAmount: dto.td.inst_amount ?? null,
          maturityDate: dto.td.maturity_date ?? null,
          maturityAmount: dto.td.maturity_amt ?? null,
          interestPayable: dto.td.intt_payable_amt ?? null,
          maturityInstruction: text(dto.td.matu_ins_desc),
          currentBalance: dto.td.current_balance ?? null,
        }
      : null,
  };
}

export function mapDepositOpeningTransactionDto(
  dto: z.infer<typeof depositOpeningTransactionDtoSchema>,
): DepositOpeningTransaction {
  return {
    transId: dto.trans_id,
    transNo: text(dto.trans_no),
    transAmount: dto.trans_amount ?? 0,
    statusCd: dto.status_cd,
    statusDesc: text(dto.status_desc),
    balanceAfter: dto.balance_after ?? null,
    voucherId: dto.voucher_id ?? null,
    voucherNo: text(dto.voucher_no),
    voucherNote: dto.voucher_note?.trim() || null,
  };
}

export function mapDepositProductSchemeDto(
  dto: z.infer<typeof depositProductSchemeDtoSchema>,
): DepositProductScheme {
  return {
    schemeId: dto.scheme_id,
    schemeCode: text(dto.scheme_code),
    schemeName: text(dto.scheme_name),
    roiPercent: dto.roi_percent ?? null,
    inttTypeDesc: text(dto.intt_type_desc),
    inttPayoutDesc: text(dto.intt_payout_desc),
    minBalance: dto.min_balance ?? null,
    withdAllow: dto.withd_allow === true,
    maxWithdAmt: dto.max_withd_amt ?? null,
    inopDays: dto.inop_days ?? null,
    isActive: dto.is_active !== false,
  };
}

export function mapDepositAccountCreateToDto(
  input: DepositAccountCreateInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    appl_date: input.applDate,
    scheme_id: input.schemeId,
    cust_type_cd: input.custTypeCd,
    cust_id_primary: input.custIdPrimary,
    op_mode_cd: input.opModeCd,
    nom_regd: input.nomRegd ?? false,
    status_cd: input.statusCd ?? 1,
  };
  if (input.prodTypeCd != null) payload.prod_type_cd = input.prodTypeCd;
  if (input.applNo) payload.appl_no = input.applNo;
  if (input.specialCatgCd != null) payload.special_catg_cd = input.specialCatgCd;
  if (input.custIdJoint1 != null) payload.cust_id_joint1 = input.custIdJoint1;
  if (input.custIdJoint2 != null) payload.cust_id_joint2 = input.custIdJoint2;
  if (input.holderName) payload.holder_name = input.holderName;
  if (input.foId != null) payload.fo_id = input.foId;
  if (input.branchId != null) payload.branch_id = input.branchId;
  if (input.sb) {
    const sb = mapSbToDto(input.sb);
    if (Object.keys(sb).length > 0) payload.sb = sb;
  }
  if (input.td) payload.td = mapTdToDto(input.td);
  return payload;
}

export function mapDepositAccountEditToDto(
  input: DepositAccountEditInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { account_id: input.accountId };
  if (input.applDate !== undefined) payload.appl_date = input.applDate;
  if (input.prodTypeCd != null) payload.prod_type_cd = input.prodTypeCd;
  if (input.schemeId !== undefined) payload.scheme_id = input.schemeId;
  if (input.custTypeCd !== undefined) payload.cust_type_cd = input.custTypeCd;
  if (input.custIdPrimary !== undefined) {
    payload.cust_id_primary = input.custIdPrimary;
  }
  if (input.opModeCd !== undefined) payload.op_mode_cd = input.opModeCd;
  if (input.applNo !== undefined) payload.appl_no = input.applNo;
  if (input.specialCatgCd !== undefined) {
    payload.special_catg_cd = input.specialCatgCd;
  }
  if (input.custIdJoint1 !== undefined) {
    payload.cust_id_joint1 = input.custIdJoint1;
  }
  if (input.custIdJoint2 !== undefined) {
    payload.cust_id_joint2 = input.custIdJoint2;
  }
  if (input.holderName !== undefined) payload.holder_name = input.holderName;
  if (input.nomRegd !== undefined) payload.nom_regd = input.nomRegd;
  if (input.foId !== undefined) payload.fo_id = input.foId;
  if (input.branchId !== undefined) payload.branch_id = input.branchId;
  if (input.sb) {
    const sb = mapSbToDto(input.sb);
    if (Object.keys(sb).length > 0) payload.sb = sb;
  }
  return payload;
}

function mapSbToDto(input: NonNullable<DepositAccountCreateInput["sb"]>) {
  const row: Record<string, unknown> = {};
  if (input.startDate) row.start_date = input.startDate;
  if (input.accountNo != null) row.account_no = input.accountNo;
  if (input.refAcNo) row.ref_ac_no = input.refAcNo;
  if (input.cbsAcNo) row.cbs_ac_no = input.cbsAcNo;
  if (input.roi != null) row.roi = input.roi;
  if (input.openingDeposit != null) row.opening_deposit = input.openingDeposit;
  if (input.paymentModeCd != null) row.payment_mode_cd = input.paymentModeCd;
  if (input.remarks) row.remarks = input.remarks;
  return row;
}

function mapTdToDto(input: NonNullable<DepositAccountCreateInput["td"]>) {
  const row: Record<string, unknown> = {
    period_yy: input.periodYy,
    period_mm: input.periodMm,
    period_dd: input.periodDd,
    inst_amount: input.instAmount,
    tds_deduct: input.tdsDeduct ? 1 : 0,
  };
  if (input.startDate) row.start_date = input.startDate;
  if (input.refAcNo) row.ref_ac_no = input.refAcNo;
  if (input.instNo != null) row.inst_no = input.instNo;
  if (input.matuInsCd != null) row.matu_ins_cd = input.matuInsCd;
  if (input.sbCreditAcId != null) row.sbcredit_ac_id = input.sbCreditAcId;
  return row;
}

export function mapDepositAccountStatusToDto(
  input: DepositAccountStatusInput,
): Record<string, unknown> {
  return {
    account_id: input.accountId,
    status_cd: input.statusCd,
  };
}

export function mapDepositAccountCloseToDto(
  input: DepositAccountCloseInput,
): Record<string, unknown> {
  return {
    account_id: input.accountId,
    closing_reason: input.closingReason.trim(),
    closing_date: input.closingDate,
  };
}

function readNumber(
  row: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readText(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readDate(row: Record<string, unknown>, keys: string[]): string | null {
  const value = readText(row, keys);
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? null;
}

export function mapDepositNomineeDto(dto: {
  nominee_id: number;
  account_id: number;
  nom_cust_id?: number | null;
  nom_cust_ref_code?: string | null;
  nom_name?: string | null;
  contact_no?: string | null;
  relation_cd: number;
  relation_desc?: string | null;
  age?: number | null;
  birth_date?: string | null;
  address?: string | null;
  guardian_name?: string | null;
  share_percent?: number | null;
  is_active?: boolean | null;
}): DepositNominee {
  const birth = dto.birth_date?.slice(0, 10) ?? null;
  return {
    nomineeId: dto.nominee_id,
    accountId: dto.account_id,
    nomCustId: dto.nom_cust_id ?? null,
    nomCustRefCode: text(dto.nom_cust_ref_code),
    nomName: text(dto.nom_name),
    contactNo: text(dto.contact_no),
    relationCd: dto.relation_cd,
    relationDesc: text(dto.relation_desc),
    age: dto.age ?? null,
    birthDate: birth && /^\d{4}-\d{2}-\d{2}$/.test(birth) ? birth : null,
    address: text(dto.address),
    guardianName: text(dto.guardian_name),
    sharePercent: dto.share_percent ?? null,
    isActive: dto.is_active !== false,
  };
}

export function mapDepositNomineeEditToDto(input: DepositNomineeEditInput) {
  const row: Record<string, unknown> = { nominee_id: input.nomineeId };
  if ("nomCustId" in input) row.nom_cust_id = input.nomCustId;
  if ("nomName" in input) row.nom_name = input.nomName;
  if ("relationCd" in input) row.relation_cd = input.relationCd;
  if ("contactNo" in input) row.contact_no = input.contactNo;
  if ("birthDate" in input) row.birth_date = input.birthDate;
  if ("age" in input) row.age = input.age;
  if ("address" in input) row.address = input.address;
  if ("guardianName" in input) row.guardian_name = input.guardianName;
  if ("sharePercent" in input) row.share_percent = input.sharePercent;
  return row;
}

export function mapDepositNomineeStatusToDto(input: DepositNomineeStatusInput) {
  return {
    nominee_id: input.nomineeId,
    is_active: input.isActive,
  };
}

export function mapDepositNomineeAddToDto(input: DepositNomineeAddInput) {
  return {
    account_id: input.accountId,
    nominees: input.nominees.map((item) => {
      const row: Record<string, unknown> = { relation_cd: item.relationCd };
      if (item.nomCustId != null) row.nom_cust_id = item.nomCustId;
      if (item.nomName) row.nom_name = item.nomName;
      if (item.contactNo) row.contact_no = item.contactNo;
      if (item.birthDate) row.birth_date = item.birthDate;
      else if (item.age != null) row.age = item.age;
      if (item.address) row.address = item.address;
      if (item.guardianName) row.guardian_name = item.guardianName;
      if (item.sharePercent != null) row.share_percent = item.sharePercent;
      return row;
    }),
  };
}

export function mapCustomerRow(
  row: Record<string, unknown>,
  kind: "member" | "group",
): DepositCustomer | null {
  const id = readNumber(
    row,
    kind === "member"
      ? ["member_id", "Member_Id", "cust_id", "id"]
      : ["group_id", "Group_Id", "id"],
  );
  const name = readText(
    row,
    kind === "member"
      ? ["member_name", "full_name", "cust_name", "name", "Member_Name"]
      : ["group_name", "name", "Group_Name"],
  );
  if (id == null || !name) return null;

  return {
    id,
    name,
    refCode: readText(row, [
      "ref_code",
      "member_code",
      "group_code",
      "cust_code",
      "member_ref",
    ]),
    mobile: readText(row, ["mobile", "mobile_no", "member_mobile"]) || null,
    branchId: readNumber(row, ["branch_id", "Branch_Id"]),
    branchCode: readText(row, ["branch_code", "Branch_Code"]),
    branchName: readText(row, ["branch_name", "Branch_Name"]),
    foId: readNumber(row, ["fo_id", "FO_Id", "staff_id"]),
    foCode: readText(row, ["fo_code", "FO_Code", "employee_code"]),
    foName: readText(row, ["fo_name", "FO_Name", "staff_name"]),
    anchorDate: readDate(
      row,
      kind === "member"
        ? ["join_date", "joining_date", "Join_Date", "member_join_date"]
        : ["formation_date", "form_date", "Formation_Date"],
    ),
    dateOfBirth: readDate(row, [
      "dob",
      "date_of_birth",
      "birth_date",
      "Dob",
    ]),
    kycPendingCount: readNumber(row, ["kyc_pending_count"]) ?? 0,
  };
}

export function mapGroupMember(
  row: Record<string, unknown>,
): SignatoryCandidate | null {
  const customer = mapCustomerRow(row, "member");
  if (!customer) return null;
  return {
    ...customer,
    role: readText(row, [
      "group_role",
      "member_role",
      "role_name",
      "role",
      "designation",
    ]),
  };
}

export function mapDepositSignatoryDto(dto: {
  signatory_id: number;
  account_id: number;
  cust_id: number;
  cust_ref_code?: string | null;
  cust_name?: string | null;
  cust_mobile?: string | null;
  signatory_role?: string | null;
  sign_file_nm?: string | null;
  photo_file_nm?: string | null;
  is_active?: boolean | null;
}): DepositSignatory {
  return {
    signatoryId: dto.signatory_id,
    accountId: dto.account_id,
    custId: dto.cust_id,
    custRefCode: text(dto.cust_ref_code),
    custName: text(dto.cust_name),
    custMobile: text(dto.cust_mobile) || null,
    signatoryRole: text(dto.signatory_role),
    signFileNm: text(dto.sign_file_nm),
    photoFileNm: text(dto.photo_file_nm),
    isActive: dto.is_active !== false,
  };
}

export function mapDepositSignatoryAddToDto(input: DepositSignatoryAddInput) {
  return {
    account_id: input.accountId,
    signatories: input.signatories.map((item) => {
      const row: Record<string, unknown> = { cust_id: item.custId };
      if (item.signFileNm) row.sign_file_nm = item.signFileNm;
      if (item.photoFileNm) row.photo_file_nm = item.photoFileNm;
      return row;
    }),
  };
}

export function mapDepositSignatoryEditToDto(input: DepositSignatoryEditInput) {
  const row: Record<string, unknown> = { signatory_id: input.signatoryId };
  if ("signFileNm" in input) row.sign_file_nm = input.signFileNm;
  if ("photoFileNm" in input) row.photo_file_nm = input.photoFileNm;
  return row;
}

export function mapDepositSignatoryStatusToDto(
  input: DepositSignatoryStatusInput,
) {
  return {
    signatory_id: input.signatoryId,
    is_active: input.isActive,
  };
}
