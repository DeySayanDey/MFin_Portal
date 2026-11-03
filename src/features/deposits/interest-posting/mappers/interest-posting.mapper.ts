import type { InterestRowDto } from "../schemas/interest-posting.schema";
import type { InterestRow } from "../types/interest-posting.types";

function text(value: string | number | null | undefined): string {
  return value == null ? "" : String(value).trim();
}

export function mapInterestRow(dto: InterestRowDto): InterestRow {
  return {
    accountId: dto.account_id,
    fullAccountNo: text(dto.full_account_no),
    applNo: text(dto.appl_no),
    holderName: text(dto.holder_name),
    schemeId: dto.scheme_id ?? null,
    schemeCode: text(dto.scheme_code),
    schemeName: text(dto.scheme_name),
    branchName: text(dto.branch_name),
    balance: dto.current_balance ?? null,
    roi: dto.roi ?? 0,
    inttTypeDesc: text(dto.intt_type_desc),
    lastPostedDate: text(dto.last_posted_date),
    fromDate: text(dto.from_date),
    toDate: text(dto.to_date),
    days: dto.days ?? 0,
    productAmount: dto.product_amount ?? null,
    calculatedInterest: Math.max(0, Math.round((dto.calculated_interest ?? 0) * 100) / 100),
  };
}
