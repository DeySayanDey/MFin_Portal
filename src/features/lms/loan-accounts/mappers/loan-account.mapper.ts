import type {
  LoanAccount,
  LoanAccountSanction,
  PaginationMeta,
  PaginationMetaDto,
} from "../types/loan-account.types";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function mapSanction(raw: unknown): LoanAccountSanction | null {
  if (!raw || typeof raw !== "object") return null;
  const dto = raw as Record<string, unknown>;
  const loanApprovalId = asNumber(dto.loan_approval_id);
  if (loanApprovalId == null) return null;
  return {
    loanApprovalId,
    sanctionedAmount: asNumber(dto.sanctioned_amount) ?? 0,
    interestRate: asNumber(dto.interest_rate) ?? 0,
    loanDuration: asNumber(dto.loan_duration) ?? 0,
    firstDueDate: asText(dto.first_due_date) || null,
    approvalDate: asText(dto.approval_date),
  };
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

export function parseLoanAccountRow(raw: unknown): LoanAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const dto = raw as Record<string, unknown>;
  const loanAccountId = asNumber(dto.loan_account_id);
  if (loanAccountId == null || loanAccountId < 1) return null;

  return {
    loanAccountId,
    loanAccountNo: asNumber(dto.loan_account_no) ?? 0,
    refAccountNo: asText(dto.ref_account_no),
    applicationId: asNumber(dto.application_id) ?? 0,
    applicationNo: asText(dto.application_no),
    applicationDate: asText(dto.application_date),
    applAmount: asNumber(dto.appl_amount) ?? 0,
    applTenure: asNumber(dto.appl_tenure) ?? 0,
    repayDurationCd: asNumber(dto.repay_duration_cd) ?? 0,
    repayDurationDesc: asText(dto.repay_duration_desc),
    loanCycle: asNumber(dto.loan_cycle) ?? 0,
    custTypeCd: asNumber(dto.cust_type_cd) ?? 0,
    custTypeDesc: asText(dto.cust_type_desc),
    custIdPrimary: asNumber(dto.cust_id_primary) ?? 0,
    primaryRefCode: asText(dto.primary_ref_code),
    primaryName: asText(dto.primary_name),
    primaryMobile: asText(dto.primary_mobile) || null,
    custIdJoint1: asNumber(dto.cust_id_joint1),
    joint1Name: asText(dto.joint1_name) || null,
    custIdJoint2: asNumber(dto.cust_id_joint2),
    joint2Name: asText(dto.joint2_name) || null,
    beneficiaryName: asText(dto.beneficiary_name) || null,
    schemeId: asNumber(dto.scheme_id) ?? 0,
    schemeCode: asText(dto.scheme_code),
    schemeName: asText(dto.scheme_name),
    schemeRoiPercent: asNumber(dto.scheme_roi_percent) ?? 0,
    sanction: mapSanction(dto.sanction),
    loanDate: asText(dto.loan_date),
    loanAmount: asNumber(dto.loan_amount) ?? 0,
    interestRate: asNumber(dto.interest_rate) ?? 0,
    disbursedAmount: asNumber(dto.disbursed_amount) ?? 0,
    undisbursedAmount: asNumber(dto.undisbursed_amount) ?? 0,
    principalOutstanding: asNumber(dto.principal_outstanding) ?? 0,
    disbursementCount: asNumber(dto.disbursement_count) ?? 0,
    finalDueDate: asText(dto.final_due_date) || null,
    isDefaulter: asBool(dto.is_defaulter),
    isNpa: asBool(dto.is_npa),
    foId: asNumber(dto.fo_id),
    foCode: asText(dto.fo_code) || null,
    foName: asText(dto.fo_name) || null,
    branchId: asNumber(dto.branch_id),
    branchCode: asText(dto.branch_code),
    branchName: asText(dto.branch_name),
    statusCd: asNumber(dto.status_cd) ?? 0,
    statusDesc: asText(dto.status_desc),
    isActive: asBool(dto.is_active),
    createdBy: asNumber(dto.created_by),
    createdByName: asText(dto.created_by_name),
    createdOn: asText(dto.created_on),
  };
}
