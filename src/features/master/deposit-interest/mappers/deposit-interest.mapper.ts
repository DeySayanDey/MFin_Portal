import type {
  DepositSchemeSlab,
  DepositSchemeSlabDto,
  DepositSchemeSlabSaveInput,
} from "../types/deposit-interest.types";

export function parseDepositSchemeSlabRow(
  raw: unknown,
): DepositSchemeSlab | null {
  if (!raw || typeof raw !== "object") return null;
  const dto = raw as Partial<DepositSchemeSlabDto>;
  if (typeof dto.id !== "number" || typeof dto.scheme_id !== "number") {
    return null;
  }

  const termDescMap: Record<number, string> = {
    1: "Days",
    2: "Months",
    3: "Year",
  };

  return {
    id: dto.id,
    schemeId: dto.scheme_id,
    schemeCode:
      dto.scheme_code || `DS-${String(dto.scheme_id).padStart(4, "0")}`,
    schemeName: dto.scheme_name || `Scheme #${dto.scheme_id}`,
    minDuration: Number(dto.min_duration ?? 0),
    maxDuration: Number(dto.max_duration ?? 0),
    termCd: Number(dto.term_cd ?? 1),
    termDesc:
      dto.term_desc ||
      termDescMap[Number(dto.term_cd)] ||
      `Term #${dto.term_cd}`,
    roi: typeof dto.roi === "number" ? dto.roi : parseFloat(String(dto.roi ?? 0)) || 0,
    lockPeriod: dto.lock_period != null ? Number(dto.lock_period) : null,
    effectFrm: String(dto.effect_frm ?? ""),
    effectUpto: dto.effect_upto ? String(dto.effect_upto) : null,
    isActive: Boolean(dto.is_active),
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at ?? null,
  };
}

export function mapDepositSchemeSlabSaveToDto(
  input: DepositSchemeSlabSaveInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    scheme_id: input.schemeId,
    min_duration: input.minDuration,
    max_duration: input.maxDuration,
    term_cd: input.termCd,
    roi: input.roi,
    effect_frm: input.effectFrm,
  };

  if (input.id != null && input.id > 0) {
    body.id = input.id;
  }
  if (input.lockPeriod != null) {
    body.lock_period = input.lockPeriod;
  }
  if (input.effectUpto) {
    body.effect_upto = input.effectUpto;
  }
  if (input.isActive !== undefined) {
    body.is_active = input.isActive;
  }

  return body;
}
