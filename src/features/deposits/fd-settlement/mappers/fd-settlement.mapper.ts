import type {
  SettlementAccountDto,
  SettlementQuoteDto,
  SettlementRequestDto,
  SettlementSaveValues,
} from "../schemas/fd-settlement.schema";
import type {
  AccountStatus,
  AccountStatusFilter,
  HoldingMode,
  KycState,
  PaymentMode,
  ReasonCode,
  RequestStatus,
  RestrictionCode,
  SchemeCode,
  SettlementAccount,
  SettlementQuote,
  SettlementRequest,
  SettlementType,
} from "../types/fd-settlement.types";

/** Code tables shared with Laravel. See docs/fd-settlement-api.md. */
export const SETTLEMENT_TYPE_CD: Record<SettlementType, number> = { maturity: 1, premature: 2 };
export const REASON_CD: Record<ReasonCode, number> = { customer: 1, financial: 2, other: 3 };
export const PAY_MODE_CD: Record<PaymentMode, number> = { cash: 1, cheque: 2, neft: 3, savings: 4 };
export const REQUEST_STATUS_CD: Record<RequestStatus, number> = {
  draft: 1,
  pending: 2,
  approved: 3,
  rejected: 4,
  settled: 5,
};
/** Option group 9. Any-2-of-3 and authorised signatory are shown as joint. */
const OP_MODE: Record<number, HoldingMode> = { 1: "single", 2: "joint", 3: "eitherOrSurvivor", 4: "joint", 5: "joint" };

function invert<T extends string>(table: Record<T, number>): Map<number, T> {
  return new Map(Object.entries(table).map(([key, code]) => [code as number, key as T]));
}

const SETTLEMENT_TYPES = invert(SETTLEMENT_TYPE_CD);
const REASONS = invert(REASON_CD);
const PAY_MODES = invert(PAY_MODE_CD);
const REQUEST_STATUSES = invert(REQUEST_STATUS_CD);

function pick<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function text(value: string | number | null | undefined): string {
  return value == null ? "" : String(value).trim();
}

function amount(value: number | null | undefined): number {
  return value ?? 0;
}

function codes<T extends string>(values: number[] | null | undefined, table: Map<number, T>): T[] {
  return (values ?? []).flatMap((code) => {
    const value = table.get(code);
    return value ? [value] : [];
  });
}

export function mapSettlementAccountDto(dto: SettlementAccountDto): SettlementAccount {
  const restriction = dto.restriction
    ? pick<RestrictionCode>(dto.restriction, ["lien", "settled", "kyc"], "settled")
    : null;
  return {
    id: dto.account_id,
    accountNumber: text(dto.account_no),
    customerName: text(dto.holder_name),
    customerId: text(dto.cust_ref_code) || text(dto.cust_id),
    kyc: pick<KycState>(dto.kyc_status, ["verified", "due", "restricted"], "due"),
    holding: OP_MODE[dto.op_mode_cd ?? 1] ?? "single",
    branchId: dto.branch_id ?? null,
    branchName: text(dto.branch_name),
    scheme: pick<SchemeCode>(dto.scheme_type, ["FD", "MIS", "OTHER"], "OTHER"),
    schemeName: text(dto.scheme_name),
    status: pick<AccountStatus>(dto.account_status, ["active", "matured", "closed", "settled"], "active"),
    principal: amount(dto.principal_amount),
    ratePercent: amount(dto.roi),
    openDate: text(dto.start_date),
    maturityDate: text(dto.maturity_date),
    tenureMonths: dto.period_months ?? 0,
    payoutFrequency: dto.payout_type === "periodic" ? "periodic" : "cumulative",
    eligible: dto.eligible ?? restriction == null,
    restriction,
    permittedTypes: codes(dto.permitted_types, SETTLEMENT_TYPES),
    paymentMethods: codes(dto.payment_methods, PAY_MODES),
    linkedAccount:
      dto.sb_account_id != null
        ? {
            accountId: dto.sb_account_id,
            accountNo: text(dto.sb_account_no),
            name: text(dto.sb_holder_name) || text(dto.holder_name),
          }
        : null,
    mis: dto.mis
      ? {
          monthlyInterest: amount(dto.mis.monthly_interest),
          lastPaidDate: text(dto.mis.last_paid_date),
          totalInterestPaid: amount(dto.mis.total_interest_paid),
          unpaidInstallments: dto.mis.unpaid_installments ?? 0,
          pendingInterest: amount(dto.mis.pending_interest),
          recoverableExcess: amount(dto.mis.recoverable_excess),
        }
      : null,
  };
}

export function mapSettlementQuoteDto(dto: SettlementQuoteDto): SettlementQuote | null {
  if (dto.net_payable == null) return null;
  return {
    quoteId: text(dto.quote_id),
    expiresOn: text(dto.valid_till),
    principal: amount(dto.principal_amount),
    interest: amount(dto.interest_amount),
    overdueInterest: amount(dto.overdue_interest),
    interestRecovery: amount(dto.interest_recovery),
    penalty: amount(dto.penalty_amount),
    tds: amount(dto.tds_amount),
    otherDeductions: amount(dto.other_deductions),
    netPayable: dto.net_payable,
  };
}

export function mapSettlementRequestDto(dto: SettlementRequestDto): SettlementRequest {
  return {
    id: dto.settlement_id,
    accountId: dto.account_id,
    accountNumber: text(dto.account_no),
    customerName: text(dto.holder_name),
    branchName: text(dto.branch_name),
    status: REQUEST_STATUSES.get(dto.status_cd) ?? "draft",
    settlementType: SETTLEMENT_TYPES.get(dto.settlement_type_cd ?? 0) ?? "maturity",
    settlementDate: text(dto.settlement_date),
    reason: REASONS.get(dto.reason_cd ?? 0) ?? "other",
    remarks: text(dto.remarks),
    paymentMode: PAY_MODES.get(dto.pay_mode_cd ?? 0) ?? "",
    beneficiaryAccount: text(dto.beneficiary_account),
    beneficiaryName: text(dto.beneficiary_name),
    ifsc: text(dto.ifsc),
    chequeRef: text(dto.cheque_ref),
    documentName: text(dto.document_name),
    rejectionReason: text(dto.rejection_reason),
    receiptRef: text(dto.receipt_no),
    netPayable: dto.net_payable ?? null,
    quote: mapSettlementQuoteDto(dto),
  };
}

export function accountStatusParam(status: AccountStatusFilter | undefined): string | undefined {
  if (!status || status === "all") return undefined;
  return status === "activeMatured" ? "active,matured" : status;
}

export function requestStatusParam(view: "pending" | "settled" | undefined): string | undefined {
  if (view === "settled") return String(REQUEST_STATUS_CD.settled);
  if (view === "pending") {
    return [REQUEST_STATUS_CD.pending, REQUEST_STATUS_CD.approved, REQUEST_STATUS_CD.rejected].join(",");
  }
  return undefined;
}

export function mapSettlementSaveToFields(values: SettlementSaveValues): Record<string, string> {
  const fields: Record<string, string | number | undefined> = {
    settlement_id: values.settlementId,
    account_id: values.accountId,
    status_cd: values.submit ? REQUEST_STATUS_CD.pending : REQUEST_STATUS_CD.draft,
    settlement_type_cd: SETTLEMENT_TYPE_CD[values.settlementType],
    settlement_date: values.settlementDate,
    reason_cd: REASON_CD[values.reason],
    remarks: values.remarks || undefined,
    pay_mode_cd: values.paymentMode ? PAY_MODE_CD[values.paymentMode] : undefined,
    sb_account_id: values.paymentMode === "savings" ? values.sbAccountId : undefined,
    beneficiary_account: values.paymentMode === "neft" ? values.beneficiaryAccount : undefined,
    beneficiary_name: values.beneficiaryName || undefined,
    ifsc: values.paymentMode === "neft" ? values.ifsc : undefined,
    cheque_ref: values.paymentMode === "cheque" ? values.chequeRef : undefined,
    net_payable: values.netPayable,
    quote_id: values.quoteId || undefined,
  };
  return Object.fromEntries(
    Object.entries(fields).flatMap(([key, value]) => (value == null || value === "" ? [] : [[key, String(value)]])),
  );
}
