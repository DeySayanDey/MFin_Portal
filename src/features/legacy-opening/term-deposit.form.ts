import { DEFAULT_OPENING_REMARK } from "./opening.constants";

export type TermEntry = {
  id: string; member: string; name: string; account: string; product: string; scheme: string;
  productId?: string; schemeId?: string;
  customerId: number | null;
  tenureUnit: string; tenureUnitLabel: string; slabId: string;
  date: string; asOnDate: string; amount: string; openingBalance: string; rate: string; payout: string; maturityInstruction: string; tenure: string;
  maturity: string; maturityAmount: string; paidUpTo: string; remarks: string;
  finYearId: string;
};

export const initialTermEntry: TermEntry = {
  id: "", member: "", name: "", account: "", customerId: null, product: "", scheme: "", productId: "", schemeId: "",
  tenureUnit: "", tenureUnitLabel: "", slabId: "", date: "", asOnDate: "", amount: "", openingBalance: "", rate: "",
  payout: "", maturityInstruction: "", tenure: "", maturity: "", maturityAmount: "", paidUpTo: "", remarks: DEFAULT_OPENING_REMARK,
  finYearId: "",
};

export function calculationTermCode(labelOrCode: string): string {
  const unit = labelOrCode.trim().toLowerCase();
  if (unit === "1" || /^days?$/.test(unit)) return "1";
  if (unit === "2" || /^weeks?$/.test(unit)) return "2";
  if (unit === "3" || /^months?$/.test(unit)) return "3";
  if (unit === "4" || /^years?$/.test(unit)) return "4";
  return "";
}

export function estimateMaturityAmount(balance: string, rate: string, tenure: string, unit: string): string {
  const code = calculationTermCode(unit);
  const balanceMatch = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(balance.trim());
  const rateMatch = /^(\d+)(?:\.(\d+))?$/.exec(rate.trim());
  const term = Number(tenure);
  const yearUnits: Record<string, number> = { "1": 365, "2": 52, "3": 12, "4": 1 };
  const denominator = yearUnits[code];
  if (!balanceMatch || !rateMatch || Number(rate) > 100 || !/^\d+$/.test(tenure) || !Number.isSafeInteger(term) || term < 1 || !denominator) return "";

  const principal = BigInt(balanceMatch[1]) * BigInt(100) + BigInt((balanceMatch[2] ?? "").padEnd(2, "0"));
  const rateDecimals = rateMatch[2] ?? "";
  const rateValue = BigInt(rateMatch[1] + rateDecimals);
  const divisor = BigInt(100) * BigInt(10) ** BigInt(rateDecimals.length) * BigInt(denominator);
  const numerator = principal * rateValue * BigInt(term);
  const amount = principal + (numerator + divisor / BigInt(2)) / divisor;
  return `${amount / BigInt(100)}.${String(amount % BigInt(100)).padStart(2, "0")}`;
}
