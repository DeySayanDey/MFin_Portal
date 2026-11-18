export type LoanDisbursementRow = {
  disbursement_id: number;
  disbursement_no: string;
  loan_account_id: number;
  loan_account_no: string;
  application_id: number;
  application_no: string;
  cust_type_cd: number;
  member_id: number | null;
  member_name: string;
  group_id: number | null;
  group_name: string | null;
  disbursement_date: string;
  gross_amount: number;
  charge_deduction: number;
  other_deduction: number;
  net_amount: number;
  payment_mode_cd: number;
  payment_mode: string;
  reference_no: string | null;
  cheque_no: string | null;
  sb_account_id: number | null;
  sb_account_no: string | null;
  is_final: boolean;
  status: string; // "Final" | "Draft"
  approval_status: string; // "Approved" | "Pending" | "rejected"
  voucher_id: number | null;
  voucher_no: string | null;
  voucher_note: string | null;
  approved_by: number | null;
  approved_by_name: string | null;
  remarks: string | null;
  branch_id: number;
  branch_name: string;
  created_by: number;
  created_by_name: string;
  created_on: string;
};

export type LoanDisbursementListQuery = {
  disbursement_id?: number;
  loan_account_id?: number;
  branch_id?: number;
  approval?: "pending" | "approved";
  is_final?: boolean;
  payment_mode_cd?: number;
  from_date?: string;
  to_date?: string;
  keyword?: string;
  page?: number;
  per_page?: number;
};

export type LoanDisbursementListResult = {
  items: LoanDisbursementRow[];
  total: number;
};

export type DisbursementChargeItem = {
  loan_charge_id: number | null;
  charge_id: number;
  charge_name: string;
  deduct_during_cd: number;
  deduct_during: string;
  source: "application" | "scheme";
  charge_amount: number;
  tax_amount: number;
  waived_amount: number;
  net_amount: number;
};

export type LoanDisbursementPreviewQuery = {
  loan_account_id: number;
  gross_amount?: number;
  other_deduction?: number;
};

export type LoanDisbursementPreviewResult = {
  loan_account_id: number;
  loan_amount: number;
  disbursed_amount: number;
  undisbursed_amount: number;
  pending_disbursements: number;
  gross_amount: number;
  charge_deduction: number;
  other_deduction: number;
  net_amount: number;
  will_be_final: boolean;
  charges: DisbursementChargeItem[];
};

export type LoanDisbursementAddInput = {
  loan_account_id: number;
  disbursement_date?: string;
  gross_amount: number;
  other_deduction?: number;
  payment_mode_cd: number;
  cheque_no?: string;
  reference_no?: string;
  sb_account_id?: number;
  is_final?: boolean;
  remarks?: string;
};

export type LoanDisbursementAddResult = LoanDisbursementRow & {
  savings_transaction?: {
    trans_id: number;
    trans_no: string;
    status_cd: number;
    balance_after: number;
    message: string;
  } | null;
  schedule_summary?: {
    loan_account_id: number;
    installments: number;
    installment_amount: number;
    final_due_date: string;
    message: string;
  } | null;
  reschedule_amount?: number | null;
};

export type LoanDisbursementApproveInput = {
  disbursement_id: number;
  approve?: boolean;
  remarks?: string;
};
