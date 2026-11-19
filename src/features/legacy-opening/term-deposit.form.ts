import { DEFAULT_OPENING_REMARK } from "./opening.constants";

export type TermEntry = {
  id: string; member: string; name: string; account: string; product: string; scheme: string;
  productId?: string; schemeId?: string;
  customerId: number | null;
  tenureUnit: string; tenureUnitLabel: string; slabId: string;
  date: string; amount: string; openingBalance: string; rate: string; payout: string; maturityInstruction: string; tenure: string;
  maturity: string; maturityAmount: string; paidUpTo: string; remarks: string;
  finYearId: string;
};

export const initialTermEntry: TermEntry = {
  id: "", member: "", name: "", account: "", customerId: null, product: "", scheme: "", productId: "", schemeId: "",
  tenureUnit: "", tenureUnitLabel: "", slabId: "", date: "", amount: "", openingBalance: "", rate: "",
  payout: "", maturityInstruction: "", tenure: "", maturity: "", maturityAmount: "", paidUpTo: "", remarks: DEFAULT_OPENING_REMARK,
  finYearId: "",
};
