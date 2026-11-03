import { parseAmount } from "@/features/deposits/interest-posting/interest-posting.rules";
import type { ChargePostRow, ChargeRow } from "./types/charge-posting.types";

export { parseAmount };

export type ChargeAmountMap = Record<string, string>;

export function chargeRowKey(accountId: number, chargeId: number): string {
  return `${accountId}:${chargeId}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function initialChargeAmounts(rows: ChargeRow[]): ChargeAmountMap {
  return Object.fromEntries(rows.map((row) => [row.rowKey, row.calculatedAmount.toFixed(2)]));
}

export function isChargeEdited(row: ChargeRow, raw: string | undefined): boolean {
  const amount = parseAmount(raw);
  return amount != null && Math.abs(amount - row.calculatedAmount) >= 0.005;
}

/** Tax on the charge; the backend recalculates it the same way when posting. */
export function chargeTax(row: ChargeRow, amount: number): number {
  return round2((amount * row.taxPercent) / 100);
}

export type ChargeLine = { charge: number; tax: number; total: number };

export function chargeLine(row: ChargeRow, raw: string | undefined): ChargeLine | null {
  const charge = parseAmount(raw);
  if (charge == null) return null;
  const tax = chargeTax(row, charge);
  return { charge, tax, total: round2(charge + tax) };
}

/** Rows ticked by default: something to charge and not already charged this period. */
export function isDefaultSelected(row: ChargeRow): boolean {
  return row.calculatedAmount > 0 && !row.chargedThisPeriod;
}

/** Accounts whose selected charges add up to more than the available balance. */
export function shortAccounts(rows: ChargeRow[], amounts: ChargeAmountMap): Set<number> {
  const totals = new Map<number, { total: number; available: number | null }>();
  for (const row of rows) {
    const line = chargeLine(row, amounts[row.rowKey]);
    const current = totals.get(row.accountId) ?? { total: 0, available: row.availableBalance };
    current.total = round2(current.total + (line?.total ?? 0));
    totals.set(row.accountId, current);
  }
  const short = new Set<number>();
  for (const [accountId, { total, available }] of totals) {
    if (available != null && total > available + 0.004) short.add(accountId);
  }
  return short;
}

export function toChargePostRows(rows: ChargeRow[], amounts: ChargeAmountMap): ChargePostRow[] | null {
  const result: ChargePostRow[] = [];
  for (const row of rows) {
    const amount = parseAmount(amounts[row.rowKey]);
    if (amount == null || amount <= 0) return null;
    result.push({
      accountId: row.accountId,
      chargeId: row.chargeId,
      calculatedAmount: row.calculatedAmount,
      chargeAmount: amount,
    });
  }
  return result;
}
