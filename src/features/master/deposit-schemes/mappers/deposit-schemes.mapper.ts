import type {
  DepositSchemeCharge,
  DepositSchemeChargeAssignResult,
  DepositSchemeChargeSaveInput,
  DepositSchemeDto,
  DepositSchemeSetup,
  DepositSchemeSetupSaveInput,
  PaginationMeta,
  PaginationMetaDto,
} from "../types/deposit-schemes.types";

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

export function mapDepositSchemeDto(dto: DepositSchemeDto): DepositSchemeSetup {
  return {
    id: dto.scheme_id,
    schemeCode: dto.scheme_code ?? "",
    schemeName: dto.scheme_name ?? "",
    depositTypeCd: dto.deposit_type_cd,
    depositTypeDesc: dto.deposit_type_desc ?? "",
    prodTypeCd: dto.prod_type_cd,
    prodTypeDesc: dto.prod_type_desc ?? "",
    roiPercent: dto.roi_percent != null ? Number(dto.roi_percent) : null,
    inttTypeCd: dto.intt_type_cd != null ? Number(dto.intt_type_cd) : null,
    inttTypeDesc: dto.intt_type_desc ?? null,
    inttPayoutCd: dto.intt_payout_cd != null ? Number(dto.intt_payout_cd) : null,
    inttPayoutDesc: dto.intt_payout_desc ?? null,
    minBalance: dto.min_balance != null ? Number(dto.min_balance) : null,
    withdAllow: Boolean(dto.withd_allow),
    maxWithdAmt: dto.max_withd_amt != null ? Number(dto.max_withd_amt) : null,
    inopDays: dto.inop_days != null ? Number(dto.inop_days) : null,
    prnLedger: dto.prn_ledger != null ? Number(dto.prn_ledger) : null,
    prnLedgerCode: dto.prn_ledger_code ?? null,
    prnLedgerName: dto.prn_ledger_name ?? null,
    inttLedg: dto.intt_ledg != null ? Number(dto.intt_ledg) : null,
    inttLedgerCode: dto.intt_ledger_code ?? null,
    inttLedgerName: dto.intt_ledger_name ?? null,
    fieldColl: Boolean(dto.field_coll),
    isActive: dto.is_active !== false,
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at ?? null,
    updatedBy: dto.updated_by ?? null,
    updatedAt: dto.updated_at ?? null,
  };
}

export function mapDepositSchemeSaveToDto(
  input: DepositSchemeSetupSaveInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    scheme_name: input.schemeName.trim(),
    deposit_type_cd: input.depositTypeCd,
    prod_type_cd: input.prodTypeCd,
    roi_percent: input.roiPercent ?? null,
    intt_type_cd: input.inttTypeCd ?? null,
    intt_payout_cd: input.inttPayoutCd ?? null,
    min_balance: input.minBalance ?? null,
    withd_allow: Boolean(input.withdAllow),
    max_withd_amt:
      input.withdAllow && input.maxWithdAmt != null ? input.maxWithdAmt : null,
    inop_days: input.inopDays ?? null,
    prn_ledger: input.prnLedger ?? null,
    intt_ledg: input.inttLedg ?? null,
    field_coll: Boolean(input.fieldColl),
    is_active: input.isActive ?? true,
  };

  if (input.schemeId != null) {
    payload.scheme_id = input.schemeId;
  }

  return payload;
}

export function parseDepositSchemeChargeRow(
  raw: unknown,
): DepositSchemeCharge | null {
  if (!raw || typeof raw !== "object") return null;
  const dto = raw as Record<string, unknown>;
  const id = asNumber(dto.id);
  const schemeId = asNumber(dto.scheme_id);
  const chargesId = asNumber(dto.charges_id);
  if (id == null || id < 1 || schemeId == null || chargesId == null) return null;

  return {
    id,
    schemeId,
    schemeCode: asText(dto.scheme_code),
    schemeName: asText(dto.scheme_name),
    chargesId,
    chargeName: asText(dto.charge_name),
    chargeRate: asNumber(dto.charge_rate),
    figureCd: asNumber(dto.figure_cd),
    figureDesc: asText(dto.figure_desc),
    ...("max_amount" in dto ? { maxAmount: asNumber(dto.max_amount) } : {}),
    ...("tax_prcent" in dto ? { taxPercent: asNumber(dto.tax_prcent) } : {}),
    ...("charges_during_cd" in dto ? { chargesDuringCd: asNumber(dto.charges_during_cd) } : {}),
    ...("charges_during_desc" in dto ? { chargesDuringDesc: asText(dto.charges_during_desc) } : {}),
    ...("charges_gl" in dto ? { chargesGl: asNumber(dto.charges_gl) } : {}),
    ...("charges_gl_code" in dto ? { chargesGlCode: asText(dto.charges_gl_code) || null } : {}),
    ...("charges_gl_name" in dto ? { chargesGlName: asText(dto.charges_gl_name) || null } : {}),
    chargeIsActive: asActive(dto.charge_is_active),
    isActive: asActive(dto.is_active),
    ...("created_by" in dto ? { createdBy: asNumber(dto.created_by) } : {}),
    ...("created_at" in dto ? { createdAt: asText(dto.created_at) || null } : {}),
  };
}

export function parseDepositSchemeChargeAssignResult(
  raw: unknown,
): DepositSchemeChargeAssignResult | null {
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
        const item = parseDepositSchemeChargeRow(row);
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

export function mapDepositSchemeChargeSaveToDto(
  input: DepositSchemeChargeSaveInput,
): Record<string, unknown> {
  return {
    scheme_id: input.schemeId,
    charges_ids: [...new Set(input.chargesIds)],
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

function asActive(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}
