import type {
  LoanSchemeSlab,
  LoanSchemeSlabSaveInput,
  PaginationMeta,
} from "../types/loan-roi-slabs.types";

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

function asFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function asDate(value: unknown): string {
  const text = asText(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

export function parseLoanSchemeSlabRow(raw: unknown): LoanSchemeSlab | null {
  if (!raw || typeof raw !== "object") return null;
  const dto = raw as Record<string, unknown>;
  const id = asNumber(dto.id);
  const schemeId = asNumber(dto.scheme_id);
  if (id == null || id < 1 || schemeId == null || schemeId < 1) return null;

  const minAmount = asNumber(dto.min_amount);
  const maxAmount = asNumber(dto.max_amount);
  const roi = asNumber(dto.roi);
  const maxDuration = asNumber(dto.max_duration);
  if (minAmount == null || maxAmount == null || roi == null || maxDuration == null) {
    return null;
  }

  const schemeCode = asText(dto.scheme_code);
  const schemeName = asText(dto.scheme_name);

  return {
    id,
    schemeId,
    schemeCode: schemeCode || `LS-${String(schemeId).padStart(4, "0")}`,
    schemeName: schemeName || `Scheme #${schemeId}`,
    repayScheduleCd: asNumber(dto.repay_schedule_cd),
    repayScheduleDesc: asText(dto.repay_schedule_desc),
    schemeIsActive: asFlag(dto.scheme_is_active),
    minAmount,
    maxAmount,
    roi,
    maxDuration,
    amtPer1000: asNumber(dto.amt_per1000),
    effectFrom: asDate(dto.effect_from),
    isActive: asFlag(dto.is_active),
    createdBy: asNumber(dto.created_by),
    createdAt: asText(dto.created_at) || null,
  };
}

export function mapLoanSchemeSlabSaveToDto(
  input: LoanSchemeSlabSaveInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    scheme_id: input.schemeId,
    min_amount: input.minAmount,
    max_amount: input.maxAmount,
    roi: input.roi,
    max_duration: input.maxDuration,
    effect_from: input.effectFrom,
  };

  if (input.id != null && input.id > 0) {
    body.id = input.id;
  }
  if (input.amtPer1000 != null) {
    body.amt_per1000 = input.amtPer1000;
  }
  if (input.isActive !== undefined) {
    body.is_active = input.isActive;
  }

  return body;
}

export function mapSlabListMeta(meta: unknown): PaginationMeta | null {
  if (!meta || typeof meta !== "object") return null;
  const dto = meta as Record<string, unknown>;
  const total = asNumber(dto.total);
  if (total == null) return null;
  const perPage = asNumber(dto.per_page) ?? 50;
  return {
    total,
    page: asNumber(dto.page) ?? 1,
    perPage,
    lastPage: asNumber(dto.last_page) ?? (Math.ceil(total / perPage) || 1),
    hasMore: Boolean(dto.has_more),
  };
}
