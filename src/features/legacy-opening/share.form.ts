import { DEFAULT_OPENING_REMARK } from "./opening.constants";

export type ShareEntry = {
  id: string; customerId: number | null; member: string; name: string; account: string; date: string;
  remarks: string; shares: string; faceValue: string;
  finYearId: string;
};

export const initialShareEntry: ShareEntry = { id: "", customerId: null, member: "", name: "", account: "", date: "", remarks: DEFAULT_OPENING_REMARK, shares: "", faceValue: "", finYearId: "" };

/** Returns the amount in paise, or null when the API limits are exceeded. */
export function shareAmountPaise(shares: string, faceValue: string): number | null {
  if (!/^\d{1,8}$/.test(shares) || !/^\d{1,6}(?:\.\d{1,2})?$/.test(faceValue)) return null;
  const count = Number(shares);
  const [whole, fraction = ""] = faceValue.split(".");
  const facePaise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (count < 1 || facePaise < 1 || count > Math.floor(9999999999 / facePaise)) return null;
  return count * facePaise;
}
