import { DEFAULT_OPENING_REMARK } from "./opening.constants";

export type GeneralFundEntry = {
  id: string; customerId: number | null; member: string; name: string; account: string; date: string;
  remarks: string; balance: string; rate: string;
  interestPaidUntil: string;
  finYearId: string;
};

export const initialGeneralFundEntry: GeneralFundEntry = { id: "", customerId: null, member: "", name: "", account: "", date: "", remarks: DEFAULT_OPENING_REMARK, balance: "", rate: "", interestPaidUntil: "", finYearId: "" };
