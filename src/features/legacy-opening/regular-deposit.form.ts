export type BatchEntry = {
  id: string; type: string; account: string; member: string; name: string;
  scheme: string; schemeId?: string; date: string; balance: string; holder: string; amount: string;
  rate: string; installment: string; maturity: string; remarks: string;
  customerType: "1" | "2"; operationMode: string; jointMember: string; jointName: string;
  customerId: number | null; customerBranchId: number | null; jointId: number | null;
  finYearId: string;
};

export const initialEntry: BatchEntry = {
  id: "", type: "SB", account: "", member: "", name: "",
  scheme: "", date: "", balance: "", holder: "",
  amount: "", rate: "", installment: "", maturity: "",
  remarks: "",
  customerType: "2", operationMode: "1", jointMember: "", jointName: "",
  customerId: null, customerBranchId: null, jointId: null,
  finYearId: "",
};
