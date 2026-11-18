import type {
  LoanSchemeCharge,
  LoanSchemeChargeAssignResult,
  LoanSchemeChargeSaveInput,
  LoanSchemeSetup,
  LoanSchemeSetupSaveInput,
  PaginationMeta,
  PaginationMetaDto,
} from "../types/loan-schemes.types";

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

export function parseLoanSchemeRow(raw: unknown): LoanSchemeSetup | null {
  if (!raw || typeof raw !== "object") return null;
  const dto = raw as Record<string, unknown>;
  const id = asNumber(dto.scheme_id);
  if (id == null || id < 1) return null;

  return {
    id,
    schemeCode: asText(dto.scheme_code),
    schemeName: asText(dto.scheme_name),
    productTypeCd: asNumber(dto.product_type_cd) ?? 0,
    productTypeDesc: asText(dto.product_type_desc),
    repayTypeCd: asNumber(dto.repay_type_cd) ?? 0,
    repayTypeDesc: asText(dto.repay_type_desc),
    roiPercent: asNumber(dto.roi_percent) ?? 0,
    inttTypeCd: asNumber(dto.intt_type_cd) ?? 0,
    inttTypeDesc: asText(dto.intt_type_desc),
    repayScheduleCd: asNumber(dto.repay_schedule_cd) ?? 0,
    repayScheduleDesc: asText(dto.repay_schedule_desc),
    isInttCapitalisation: asFlag(dto.is_intt_capitalisation),
    capitalisationOnCd: asNumber(dto.capitalisation_on_cd),
    capitalisationOnDesc: asText(dto.capitalisation_on_desc),
    isIncentive: asFlag(dto.is_incentive),
    incentiveDay: asNumber(dto.incentive_day),
    incentiveRate: asNumber(dto.incentive_rate),
    isOverdue: asFlag(dto.is_overdue),
    repayGraceDays: asNumber(dto.repay_grace_days),
    overdueOnCd: asNumber(dto.overdue_on_cd),
    overdueOnDesc: asText(dto.overdue_on_desc),
    overdurRate: asNumber(dto.overdur_rate),
    isNpa: asFlag(dto.is_npa),
    npaAfterDays: asNumber(dto.npa_after_days),
    isMortgageReqd: asFlag(dto.is_mortgage_reqd),
    isGuarantorReqd: asFlag(dto.is_guarantor_reqd),
    loanLedger: asNumber(dto.loan_ledger),
    loanLedgerCode: asText(dto.loan_ledger_code) || null,
    loanLedgerName: asText(dto.loan_ledger_name) || null,
    inttLedger: asNumber(dto.intt_ledger),
    inttLedgerCode: asText(dto.intt_ledger_code) || null,
    inttLedgerName: asText(dto.intt_ledger_name) || null,
    odinttLedger: asNumber(dto.odintt_ledger),
    odinttLedgerCode: asText(dto.odintt_ledger_code) || null,
    odinttLedgerName: asText(dto.odintt_ledger_name) || null,
    fieldCollAllow: asFlag(dto.field_coll_allow),
    isActive: dto.is_active == null ? true : asFlag(dto.is_active),
    createdBy: asNumber(dto.created_by),
    createdAt: asText(dto.created_at) || null,
    updatedBy: asNumber(dto.updated_by),
    updatedAt: asText(dto.updated_at) || null,
  };
}

export function mapLoanSchemeSaveToDto(
  input: LoanSchemeSetupSaveInput,
): Record<string, unknown> {
  const capitalise = Boolean(input.isInttCapitalisation);
  const incentive = Boolean(input.isIncentive);
  const overdue = Boolean(input.isOverdue);
  const npa = Boolean(input.isNpa);

  const payload: Record<string, unknown> = {
    scheme_name: input.schemeName.trim(),
    product_type_cd: input.productTypeCd,
    repay_type_cd: input.repayTypeCd,
    roi_percent: input.roiPercent,
    intt_type_cd: input.inttTypeCd,
    repay_schedule_cd: input.repayScheduleCd,
    is_intt_capitalisation: capitalise,
    capitalisation_on_cd: capitalise ? (input.capitalisationOnCd ?? null) : null,
    is_incentive: incentive,
    incentive_day: incentive ? (input.incentiveDay ?? null) : null,
    incentive_rate: incentive ? (input.incentiveRate ?? null) : null,
    is_overdue: overdue,
    repay_grace_days: overdue ? (input.repayGraceDays ?? null) : null,
    overdue_on_cd: overdue ? (input.overdueOnCd ?? null) : null,
    overdur_rate: overdue ? (input.overdurRate ?? null) : null,
    is_npa: npa,
    npa_after_days: npa ? (input.npaAfterDays ?? null) : null,
    is_mortgage_reqd: Boolean(input.isMortgageReqd),
    is_guarantor_reqd: Boolean(input.isGuarantorReqd),
    loan_ledger: input.loanLedger ?? null,
    intt_ledger: input.inttLedger ?? null,
    odintt_ledger: input.odinttLedger ?? null,
    field_coll_allow: Boolean(input.fieldCollAllow),
    is_active: input.isActive ?? true,
  };

  if (input.schemeId != null) {
    payload.scheme_id = input.schemeId;
  }

  return payload;
}

export function parseLoanSchemeChargeRow(raw: unknown): LoanSchemeCharge | null {
  if (!raw || typeof raw !== "object") return null;
  const dto = raw as Record<string, unknown>;
  const id = asNumber(dto.id);
  const schemeId = asNumber(dto.scheme_id);
  const chargeId = asNumber(dto.charge_id);
  if (id == null || id < 1 || schemeId == null || chargeId == null) return null;

  return {
    id,
    schemeId,
    schemeCode: asText(dto.scheme_code),
    schemeName: asText(dto.scheme_name),
    chargeId,
    chargeName: asText(dto.charge_name),
    chargeRate: asNumber(dto.charge_rate),
    figureCd: asNumber(dto.figure_cd),
    figureDesc: asText(dto.figure_desc),
    maxAmount: asNumber(dto.max_amount),
    taxPercent: asNumber(dto.tax_prcent) ?? 0,
    deductDuringCd: asNumber(dto.deduct_during_cd),
    deductDuringDesc: asText(dto.deduct_during_desc),
    chargesGl: asNumber(dto.charges_gl),
    chargesGlCode: asText(dto.charges_gl_code) || null,
    chargesGlName: asText(dto.charges_gl_name) || null,
    chargeIsActive: asFlag(dto.charge_is_active),
    isActive: asFlag(dto.is_active),
    createdBy: asNumber(dto.created_by),
    createdAt: asText(dto.created_at) || null,
  };
}

export function parseLoanSchemeChargeAssignResult(
  raw: unknown,
): LoanSchemeChargeAssignResult | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const schemeId = asNumber(body.scheme_id);
  if (schemeId == null) return null;

  const summaryRaw =
    body.summary && typeof body.summary === "object"
      ? (body.summary as Record<string, unknown>)
      : {};
  const charges = Array.isArray(body.charges)
    ? body.charges.flatMap((row) => {
        const item = parseLoanSchemeChargeRow(row);
        return item ? [item] : [];
      })
    : [];

  return {
    schemeId,
    summary: {
      inserted: asNumber(summaryRaw.inserted) ?? 0,
      reactivated: asNumber(summaryRaw.reactivated) ?? 0,
      deactivated: asNumber(summaryRaw.deactivated) ?? 0,
      unchanged: asNumber(summaryRaw.unchanged) ?? 0,
    },
    charges,
  };
}

export function mapLoanSchemeChargeSaveToDto(
  input: LoanSchemeChargeSaveInput,
): Record<string, unknown> {
  return {
    scheme_id: input.schemeId,
    charge_ids: [...new Set(input.chargeIds)],
  };
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}
