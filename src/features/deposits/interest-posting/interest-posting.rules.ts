import type { InterestPostRow, InterestRow } from "./types/interest-posting.types";

const AMOUNT_PATTERN = /^\d{1,8}(\.\d{0,2})?$/;

export type AmountMap = Record<number, string>;

/** A valid interest amount (non-negative, up to 2 decimals), or null. */
export function parseAmount(raw: string | undefined): number | null {
  const value = (raw ?? "").trim();
  if (!AMOUNT_PATTERN.test(value)) return null;
  return Number(value);
}

export function initialAmounts(rows: InterestRow[]): AmountMap {
  return Object.fromEntries(rows.map((row) => [row.accountId, row.calculatedInterest.toFixed(2)]));
}

export function isEdited(row: InterestRow, raw: string | undefined): boolean {
  const amount = parseAmount(raw);
  return amount != null && Math.abs(amount - row.calculatedInterest) >= 0.005;
}

/** Accounts with an interest period to post. */
export function isPostable(row: InterestRow): boolean {
  return row.days > 0 && row.fromDate !== "" && row.toDate !== "";
}

export function toPostRows(rows: InterestRow[], amounts: AmountMap): InterestPostRow[] | null {
  const result: InterestPostRow[] = [];
  for (const row of rows) {
    const amount = parseAmount(amounts[row.accountId]);
    if (amount == null) return null;
    result.push({
      accountId: row.accountId,
      fromDate: row.fromDate,
      toDate: row.toDate,
      calculatedInterest: row.calculatedInterest,
      interestAmount: amount,
    });
  }
  return result;
}
