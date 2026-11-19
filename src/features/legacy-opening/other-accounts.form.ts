import { DEFAULT_OPENING_REMARK } from "./opening.constants";

export type ThriftEntry = {
  id: string; customerId: number | null; member: string; name: string; account: string; date: string; remarks: string;
  installment: string; rate: string; last: string; balance: string;
  finYearId: string;
};
export const initialThriftEntry: ThriftEntry = { id: "", customerId: null, member: "", name: "", account: "", date: "", remarks: DEFAULT_OPENING_REMARK, installment: "", rate: "", last: "", balance: "", finYearId: "" };

export type LoanEntry = {
  id: string; member: string; name: string; account: string; product: string; productCode: string; applicationNo: string;
  disbursementDate: string; sanction: string; disbursement: string; rate: string;
  repayment: string; repaymentCode: string; repaymentSchedule: string; tenure: string; tenureUnit: string; emi: string; interestPaidUpTo: string;
  principal: string; interest: string; remarks: string;
  finYearId: string;
};
export const initialLoanEntry: LoanEntry = {
  id: "", member: "", name: "", account: "", product: "", productCode: "", applicationNo: "", disbursementDate: "",
  sanction: "", disbursement: "", rate: "", repayment: "", repaymentCode: "", repaymentSchedule: "", tenure: "", tenureUnit: "", emi: "", interestPaidUpTo: "",
  principal: "", interest: "", remarks: "",
  finYearId: "",
};
