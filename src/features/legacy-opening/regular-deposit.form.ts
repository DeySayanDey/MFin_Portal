import { DEFAULT_OPENING_REMARK } from "./opening.constants";

export type BatchEntry = {
  id: string; type: string; account: string; member: string; name: string;
  scheme: string; schemeId?: string; date: string; asOnDate: string; balance: string; holder: string; amount: string;
  rate: string; installment: string; maturity: string; remarks: string;
  customerType: "1" | "2"; operationMode: string; jointMember: string; jointName: string;
  customerId: number | null; customerBranchId: number | null; jointId: number | null;
  finYearId: string;
};

export const initialEntry: BatchEntry = {
  id: "", type: "SB", account: "", member: "", name: "",
  scheme: "", date: "", asOnDate: "", balance: "", holder: "",
  amount: "", rate: "", installment: "", maturity: "",
  remarks: DEFAULT_OPENING_REMARK,
  customerType: "2", operationMode: "1", jointMember: "", jointName: "",
  customerId: null, customerBranchId: null, jointId: null,
  finYearId: "",
};
