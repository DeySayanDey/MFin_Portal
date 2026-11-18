import type { ChargeRowDto } from "../schemas/charge-posting.schema";
import type { ChargeRow } from "../types/charge-posting.types";
import { chargeRowKey } from "../charge-posting.rules";

function text(value: string | number | null | undefined): string {
  return value == null ? "" : String(value).trim();
}

export function mapChargeRow(dto: ChargeRowDto): ChargeRow {
  return {
    rowKey: chargeRowKey(dto.account_id, dto.charge_id),
    accountId: dto.account_id,
    fullAccountNo: text(dto.full_account_no),
    applNo: text(dto.appl_no),
    holderName: text(dto.holder_name),
    schemeId: dto.scheme_id ?? null,
    schemeCode: text(dto.scheme_code),
    schemeName: text(dto.scheme_name),
    branchName: text(dto.branch_name),
    balance: dto.current_balance ?? null,
    availableBalance: dto.available_balance ?? dto.current_balance ?? null,
    chargeId: dto.charge_id,
    chargeName: text(dto.charge_name),
    figureCd: dto.figure_cd ?? null,
    chargeRate: dto.charge_rate ?? null,
    maxAmount: dto.max_amount ?? null,
    taxPercent: Math.max(0, dto.tax_percent ?? 0),
    duringDesc: text(dto.charges_during_desc),
    lastChargedDate: text(dto.last_charged_date),
    chargedThisPeriod: dto.charged_this_period,
    calculatedAmount: Math.max(0, Math.round((dto.calculated_amount ?? 0) * 100) / 100),
  };
}
