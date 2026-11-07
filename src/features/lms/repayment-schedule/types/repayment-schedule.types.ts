export type LoanScheduleStatus =
  | "Paid"
  | "Due"
  | "Overdue"
  | "Partly Paid"
  | "Upcoming"
  | "Closed"
  | string;

export type LoanScheduleRow = {
  scheduleId: number;
  loanAccountId: number;
  installmentNo: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  principalWaived: number;
  interestWaived: number;
  advancePaid: number;
  principalPaid: number;
  interestPaid: number;
  paidAmount: number;
  balanceDue: number;
  outsPrincipal: number;
  collectionId: number | null;
  collectionTransNo: string | null;
  status: LoanScheduleStatus;
};

export type LoanScheduleListQuery = {
  loanAccountId: number;
  asOn?: string;
};

export type LoanScheduleListResult = {
  items: LoanScheduleRow[];
  asOn: string | null;
};

/** Laravel / SP snake_case row from USP_LOAN_SCHEDULE_LIST. */
export type LoanScheduleRowDto = {
  schedule_id?: number | string | null;
  Schedule_Id?: number | string | null;
  loan_account_id?: number | string | null;
  Loan_Account_Id?: number | string | null;
  installment_no?: number | string | null;
  Installment_No?: number | string | null;
  due_date?: string | null;
  Due_Date?: string | null;
  principal_due?: number | string | null;
  Principal_Due?: number | string | null;
  interest_due?: number | string | null;
  Interest_Due?: number | string | null;
  total_due?: number | string | null;
  Total_Due?: number | string | null;
  principal_waived?: number | string | null;
  Principal_Waived?: number | string | null;
  interest_waived?: number | string | null;
  Interest_Waived?: number | string | null;
  advance_paid?: number | string | null;
  Advance_Paid?: number | string | null;
  principal_paid?: number | string | null;
  Principal_Paid?: number | string | null;
  interest_paid?: number | string | null;
  Interest_Paid?: number | string | null;
  paid_amount?: number | string | null;
  Paid_Amount?: number | string | null;
  balance_due?: number | string | null;
  Balance_Due?: number | string | null;
  outs_principal?: number | string | null;
  Outs_Principal?: number | string | null;
  collection_id?: number | string | null;
  Collection_Id?: number | string | null;
  collection_trans_no?: string | null;
  Collection_Trans_No?: string | null;
  status?: string | null;
  Status?: string | null;
};
