import type {
  LoanEligibilityParameter,
  LoanEligibilitySaveInput,
  PaginationMeta,
} from "../types/loan-eligibility.types";

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

function asDate(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  return text.length >= 10 ? text.slice(0, 10) : text;
}

export function parseLoanEligibilityRow(
  raw: unknown,
): LoanEligibilityParameter | null {
  if (!raw || typeof raw !== "object") return null;
  const dto = raw as Record<string, unknown>;
  const paramId = asNumber(dto.param_id) ?? asNumber(dto.id);
  if (paramId == null || paramId < 1) return null;

  const parameterName = asText(dto.parameter_name);
  const dataType = asText(dto.data_type).toUpperCase();
  const operator = asText(dto.operator);
  if (!parameterName || !dataType || !operator) return null;

  return {
    paramId,
    parameterName,
    dataType,
    operator,
    reqValue: asNumber(dto.req_value),
    valueCd: asNumber(dto.value_cd),
    valueDesc: asText(dto.value_desc),
    parameterValue: asText(dto.parameter_value),
    isMandatory: asFlag(dto.is_mandatory),
    isActive: asFlag(dto.is_active),
    effectiveFrom: asDate(dto.effective_from),
    createdBy: asNumber(dto.created_by),
    createdAt: asText(dto.created_at) || null,
  };
}

export function mapLoanEligibilitySaveToDto(
  input: LoanEligibilitySaveInput,
): Record<string, unknown> {
  const kind = input.dataType.trim().toUpperCase();
  const body: Record<string, unknown> = {
    param_id: input.paramId,
    operator: input.operator.trim(),
  };

  if (
    kind === "NUMBER" ||
    kind === "AMOUNT" ||
    kind === "PERCENTAGE" ||
    kind === "BOOLEAN"
  ) {
    body.req_value = input.reqValue;
  }

  if (kind === "NUMBER" && input.valueCd != null) {
    body.value_cd = input.valueCd;
  }

  if (kind === "TEXT" || kind === "DATE") {
    body.parameter_value = input.parameterValue?.trim() ?? "";
  }

  if (input.isMandatory !== undefined) {
    body.is_mandatory = input.isMandatory;
  }
  if (input.effectiveFrom !== undefined) {
    body.effective_from = input.effectiveFrom;
  }
  if (input.isActive !== undefined) {
    body.is_active = input.isActive;
  }

  return body;
}

export function mapEligibilityListMeta(meta: unknown): PaginationMeta | null {
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
