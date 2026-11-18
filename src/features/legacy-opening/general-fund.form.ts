export type GeneralFundEntry = {
  id: string; customerId: number | null; member: string; name: string; account: string; date: string;
  remarks: string; balance: string; rate: string;
  interestPaidUntil: string;
  finYearId: string;
};

export const initialGeneralFundEntry: GeneralFundEntry = { id: "", customerId: null, member: "", name: "", account: "", date: "", remarks: "", balance: "", rate: "", interestPaidUntil: "", finYearId: "" };
