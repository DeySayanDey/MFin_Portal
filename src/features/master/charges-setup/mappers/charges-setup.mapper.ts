import type {
  ChargeKind,
  ChargeSetup,
  ChargeSetupDto,
  ChargeSetupSaveInput,
} from "../types/charges-setup.types";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asActive(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export function mapChargeSetupDto(
  dto: ChargeSetupDto,
  kind: ChargeKind,
): ChargeSetup | null {
  const chargeId = asNumber(dto.charge_id);
  const chargeName = dto.charge_name?.trim() ?? "";
  if (chargeId == null || chargeId < 1 || !chargeName) return null;

  const duringDesc =
    kind === "deposit"
      ? (dto.charges_during_desc ?? "")
      : (dto.deduct_during_desc ?? "");

  return {
    chargeId,
    chargeName,
    chargeType: kind === "deposit" ? asNumber(dto.type_cd) : null,
    chargeTypeDesc: kind === "deposit" ? (dto.type_desc ?? "") : "",
    chargeRate: asNumber(dto.charge_rate),
    figureCd: asNumber(dto.figure_cd),
    figureDesc: dto.figure_desc ?? "",
    maxAmount: asNumber(dto.max_amount),
    taxPercent: asNumber(dto.tax_prcent) ?? 0,
    duringCd: asNumber(
      kind === "deposit" ? dto.charges_during_cd : dto.deduct_during_cd,
    ),
    duringDesc,
    chargesGl: asNumber(dto.charges_gl),
    chargesGlCode: dto.charges_gl_code ?? null,
    chargesGlName: dto.charges_gl_name ?? null,
    isRefundable: kind === "loan" && asActive(dto.is_refundable),
    isAdjustable: kind === "loan" && dto.is_adjustable != null ? asActive(dto.is_adjustable) : null,
    isActive: asActive(dto.is_active),
    createdBy: asNumber(dto.created_by),
    createdAt: dto.created_at ?? null,
  };
}

export function mapChargeSetupSaveToDto(
  kind: ChargeKind,
  input: ChargeSetupSaveInput,
): Record<string, unknown> {
  const isUpdate = input.chargeId != null;
  const body: Record<string, unknown> = {
    charge_name: input.chargeName.trim(),
    charge_rate: input.chargeRate,
    figure_cd: input.figureCd,
    tax_prcent: input.taxPercent ?? 0,
  };

  if (kind === "deposit") {
    body.charges_during_cd = input.duringCd;
    if (input.chargeType !== undefined) body.type_cd = input.chargeType;
  } else {
    body.deduct_during_cd = input.duringCd;
    body.is_refundable = input.isRefundable === true;
    if (input.isAdjustable !== undefined) body.is_adjustable = input.isAdjustable;
  }

  if (isUpdate) {
    body.charge_id = input.chargeId;
    body.max_amount = input.maxAmount ?? null;
    body.charges_gl = input.chargesGl ?? null;
    if (input.isActive != null) body.is_active = input.isActive;
  } else {
    if (input.maxAmount != null) body.max_amount = input.maxAmount;
    if (input.chargesGl != null) body.charges_gl = input.chargesGl;
    if (input.isActive != null) body.is_active = input.isActive;
  }

  return body;
}
