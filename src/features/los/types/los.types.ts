export type LoanBorrowerLookupItem = {
  member_id: number;
  ref_code: string;
  member_name: string;
  mobile_no: string;
  group_id: number | null;
  group_name: string | null;
  center_id: number | null;
  center_name: string | null;
  branch_id: number;
  branch_name: string;
  fo_id: number | null;
  fo_name: string | null;
  date_of_birth: string;
  joining_date: string;
  monthly_income: number;
  monthly_expense: number;
  bank_name: string | null;
  bank_account_no: string | null;
  ifsc_code: string | null;
  active_loan_count: number;
  loan_cycle: number;
  pending_application_no: string | null;
  overdue_amount: number;
  kyc_verified: boolean;
};

export type LoanBorrowerLookupQuery = {
  keyword?: string;
  branch_id?: number;
  group_id?: number;
  center_id?: number;
  cust_type_cd?: number;
  eligible_only?: boolean;
  page?: number;
  per_page?: number;
};

export type LoanApplicationSummary = {
  total_count: number;
  field_verification_count: number;
  approval_count: number;
  sanctioned_count: number;
  disbursed_count: number;
  rejected_count: number;
  total_requested: number;
  total_sanctioned: number;
};

export type LoanApplicationRow = {
  application_id: number;
  application_no: string;
  application_date: string;
  cust_type_cd: number; // 1 Group / 2 Individual
  cust_type: string;
  cust_id_primary: number;
  member_name: string;
  member_ref_code: string;
  mobile_no: string;
  group_id: number | null;
  cust_id_joint1: number | null;
  joint1_name: string | null;
  cust_id_joint2: number | null;
  joint2_name: string | null;
  scheme_id: number;
  scheme_code: string;
  scheme_name: string;
  purpose_id: number | null;
  member_purposes: string | null;
  purpose: string | null;
  loan_cycle: number;
  appl_amount: number;
  appl_tenure: number;
  repay_duration_cd: number;
  repay_duration: string;
  /** `mst_appl_options` group 41: 1 Cash, 2 Bank Cheque, 3 Bank Transfer, 4 S/B Account, 5 Adjustment. */
  payment_mode_cd?: number | null;
  payment_mode?: string | null;
  beneficiary_name: string | null;
  bank_name?: string | null;
  bank_account_no: string | null;
  ifsc_code: string | null;
  sb_account_id?: number | null;
  sb_account_no?: string | null;
  adjustment_ref?: string | null;
  guarantor_name: string | null;
  guarantor_count: number;
  mortgage_summary: string | null;
  collateral_summary: string | null;
  mortgage_count: number;
  freeze_count: number;
  charges_count: number;
  charges_total: number;
  charges_pending: number;
  member_count: number;
  sanctioned_amount: number | null;
  loan_account_id: number | null;
  loan_account_no: string | null;
  disbursed_amount: number | null;
  principal_outstanding: number | null;
  ln_status_cd: number | null;
  due_amount: number | null;
  collected_amount: number | null;
  appl_status_cd: number; // 1 Submitted, 2 Approved, 3 Rejected, 4 Resubmission
  appl_status: string;
  stage: string; // field_verification | approval | assessment | sanctioned | disbursed | rejected
  current_owner: string;
  remarks: string | null;
  branch_id: number;
  branch_code: string;
  branch_name: string;
  fo_id: number | null;
  fo_code: string | null;
  fo_name: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  modified_by: number | null;
  modified_by_name: string | null;
  modified_at: string | null;
};

export type LoanApplicationListQuery = {
  page?: number;
  per_page?: number;
  keyword?: string;
  stage?: string;
  application_id?: number;
  scheme_id?: number;
  branch_id?: number;
  fo_id?: number;
  cust_type_cd?: number;
  appl_status_cd?: number;
  member_id?: number;
  group_id?: number;
  from_date?: string;
  to_date?: string;
};

export type LoanApplicationListResult = {
  items: LoanApplicationRow[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
    has_more: boolean;
    summary?: LoanApplicationSummary;
  };
};

export type LoanApplicationMember = {
  customer_id: number;
  member_name: string;
  ref_code: string;
  mobile_no: string;
  member_role: string;
  requested_amount: number;
  loan_purpose: string | null;
  monthly_income: number | null;
  monthly_expense: number | null;
  existing_loan_obligation: number | null;
  sanction_amount: number | null;
  disb_amount: number | null;
  appl_status: string | null;
};

export type LoanApplicationCharge = {
  loan_charge_id: number;
  loan_application_id: number;
  charge_id: number;
  charge_name: string;
  figure_cd: number;
  figure: string;
  charge_rate: number;
  deduct_during_cd: number;
  deduct_during: string;
  is_refundable: boolean;
  charge_amount: number;
  tax_amount: number;
  total_charge: number;
  waived_amount: number;
  net_amount: number;
  waiver_reason: string | null;
  voucher_id: number | null;
  voucher_no: string | null;
  tr_status_cd: number;
  tr_status: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
};

export type LoanApplicationGuarantor = {
  loan_guarantor_id: number;
  loan_application_id: number;
  guarantor_id: number;
  ref_code: string;
  guarantor_name: string;
  mobile_no: string;
  relationship_with_borrower: string | null;
  guarantee_amount: number;
  consent_date: string | null;
  consent_document_path: string | null;
  consent_document_url: string | null;
  release_date: string | null;
  release_by: number | null;
  release_by_name: string | null;
  remarks: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
};

export type LoanApplicationMortgage = {
  mortgage_id: number;
  mortgage_no: string;
  loan_application_id: number;
  collateral_type_cd: number;
  collateral_type: string;
  mortgage_description: string;
  ownership_type_cd: number | null;
  ownership_type: string | null;
  market_value: number;
  expiry_date: string | null;
  mortgage_execution_date: string | null;
  release_date: string | null;
  released_by: number | null;
  released_by_name: string | null;
  release_reason: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string | null;
};

export type LoanApplicationProject = {
  project_id: number;
  loan_application_id: number;
  project_category: string | null;
  project_name: string;
  business_activity: string | null;
  project_address: string | null;
  latitude: number | null;
  longitude: number | null;
  existing_project: boolean | null;
  project_start_date: string | null;
  total_project_cost: number | null;
  applicant_contribution: number | null;
  other_funding: number | null;
  proposed_loan_amount: number | null;
  expected_monthly_net_income: number | null;
  existing_monthly_income: number | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
};

export type LoanApplicationDepositFreeze = {
  freeze_id: number;
  loan_application_id: number;
  application_no: string;
  deposit_account_id: number;
  deposit_appl_no: string | null;
  holder_name: string | null;
  deposit_type_cd: number;
  deposit_type: string;
  deposit_account_no: string;
  current_balance: number;
  available_balance: number;
  freeze_reference_no: string;
  freeze_type_cd: number;
  freeze_type: string;
  freeze_amount: number;
  freeze_date: string;
  freeze_status_cd: number;
  freeze_status: string;
  release_date: string | null;
  release_by: number | null;
  release_by_name: string | null;
  release_reason: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string | null;
};

export type LoanApplicationDetail = LoanApplicationRow & {
  charges: LoanApplicationCharge[];
  guarantors: LoanApplicationGuarantor[];
  mortgages: LoanApplicationMortgage[];
  project: LoanApplicationProject | null;
  deposit_freezes: LoanApplicationDepositFreeze[];
  members: LoanApplicationMember[];
  inspections: LoanInspectionRow[];
  approvals: LoanApprovalRow[];
};

export type LoanApplicationAddInput = {
  application_date?: string;
  cust_type_cd: number; // 2
  cust_id_primary: number;
  cust_id_joint1?: number | null;
  cust_id_joint2?: number | null;
  scheme_id: number;
  purpose_id?: number | null;
  appl_amount: number;
  appl_tenure: number;
  repay_duration_cd: number;
  payment_mode_cd: number;
  beneficiary_name?: string | null;
  bank_name?: string | null;
  bank_account_no?: string | null;
  ifsc_code?: string | null;
  sb_account_id?: number | null;
  adjustment_ref?: string | null;
  fo_id?: number | null;
  branch_id?: number | null;
  remarks?: string | null;
};

export type LoanApplicationBulkAddMember = {
  customer_id: number;
  requested_amount: number;
  loan_purpose?: string | null;
  monthly_income?: number | null;
  monthly_expense?: number | null;
  existing_loan_obligation?: number | null;
};

export type LoanApplicationBulkAddInput = {
  application_date?: string;
  group_id: number;
  center_id?: number | null;
  scheme_id: number;
  purpose_id?: number | null;
  appl_tenure: number;
  repay_duration_cd: number;
  fo_id?: number | null;
  branch_id?: number | null;
  remarks?: string | null;
  payment_mode_cd: number;
  beneficiary_name?: string | null;
  bank_name?: string | null;
  bank_account_no?: string | null;
  ifsc_code?: string | null;
  adjustment_ref?: string | null;
  members: LoanApplicationBulkAddMember[];
};

export type LoanApplicationEditInput = Partial<LoanApplicationAddInput> & {
  application_id: number;
  group_id?: number | null;
  members?: LoanApplicationBulkAddMember[];
};

export type LoanApplicationStatusInput = {
  application_id: number;
  appl_status_cd: number; // 3 Reject, 4 Send back, 1 Resubmit
  remarks?: string;
};

export type LoanApplicationTimelineEvent = {
  seq: number;
  stage: string;
  date: string;
  by: string;
  result: string | null;
  amount: number | null;
  ref_no: string | null;
  remarks: string | null;
};

export type LoanEligibilityCheckItem = {
  member_id: number;
  member_name: string;
  param_id: number;
  parameter_name: string;
  rule: string;
  actual_value: string;
  passed: boolean | null;
  is_mandatory: boolean;
};

export type LoanEligibilityResult = {
  application_id: number;
  cust_type_cd: number;
  all_mandatory_passed: boolean;
  not_evaluated_count: number;
  monthly_income: number | null;
  existing_obligation: number | null;
  proposed_monthly_installment: number | null;
  interest_rate: number | null;
  foir_percent: number | null;
  max_eligible_amount: number | null;
  checks: LoanEligibilityCheckItem[];
};

export type LoanInspectionRow = {
  inspection_id: number | null;
  loan_application_id: number;
  application_no: string;
  application_date: string;
  appl_amount: number;
  cust_type_cd: number;
  cust_type: string;
  customer_id: number;
  member_name: string;
  group_name: string | null;
  scheme_name: string;
  inspection_date: string;
  fo_id: number;
  fo_code: string | null;
  fo_name: string;
  all_verified: boolean;
  recommended_amount: number | null;
  inspection_notes: string | null;
  inspection_result_cd: number; // 1 Positive, 2 Negative, 3 Re-Inspection
  inspection_result: string;
  latitude: number | null;
  longitude: number | null;
  photo_path: string | null;
  photo_url: string | null;
  appl_status_cd: number;
  appl_status: string;
  stage: string;
  branch_id: number;
  branch_name: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
};

export type LoanInspectionListQuery = {
  page?: number;
  per_page?: number;
  pending_only?: boolean;
  application_id?: number;
  inspection_id?: number;
  fo_id?: number;
  branch_id?: number;
  inspection_result_cd?: number;
  from_date?: string;
  to_date?: string;
  keyword?: string;
};

export type LoanInspectionAddInput = {
  loan_application_id: number;
  customer_id?: number | null;
  inspection_date: string;
  fo_id: number;
  all_verified?: boolean;
  recommended_amount?: number | null;
  inspection_notes?: string | null;
  inspection_result_cd: number;
  latitude?: number | null;
  longitude?: number | null;
  photo_path?: string | null;
};

export type LoanInspectionEditInput = Partial<LoanInspectionAddInput> & {
  inspection_id: number;
};

export type LoanSanctionPreviewUpfrontDeduction = {
  charge_id: number;
  charge_name: string;
  deduct_during_cd: number;
  deduct_during: string;
  source: string;
  charge_amount: number;
  amount: number;
  tax_amount: number;
  waived_amount: number;
  net_amount: number;
};

export type LoanSanctionPreviewScheduleItem = {
  installment_no: number;
  due_date: string;
  principal_due: number;
  interest_due: number;
  total_due: number;
  outs_principal: number;
};

export type LoanSanctionPreviewResult = {
  application_id: number;
  sanctioned_amount: number;
  interest_rate: number;
  intt_type_cd: number;
  intt_type: string;
  interest_type: string;
  repay_type_cd: number;
  repay_type: string;
  loan_duration: number;
  repay_schedule_cd: number;
  repay_schedule: string;
  moratorium_days: number;
  installment_amount: number;
  total_interest: number;
  total_repayable: number;
  first_due_date: string;
  last_due_date: string;
  total_deductions: number;
  net_disbursal_amount: number;
  apr_percent: number;
  upfront_deductions: LoanSanctionPreviewUpfrontDeduction[];
  schedule_preview: LoanSanctionPreviewScheduleItem[];
};

export type LoanSanctionPreviewQuery = {
  application_id: number;
  sanctioned_amount?: number;
  interest_rate?: number;
  loan_duration?: number;
  repay_schedule_cd?: number;
  moratorium_days?: number;
  first_due_date?: string;
};

export type LoanApprovalRow = {
  loan_approval_id: number;
  loan_application_id: number;
  application_no: string;
  application_date: string;
  cust_type_cd: number;
  cust_type: string;
  cust_id_primary: number;
  member_name: string;
  scheme_id: number;
  scheme_name: string;
  application_amount: number;
  appl_tenure: number;
  recommended_amount: number | null;
  sanctioned_amount: number | null;
  interest_rate: number | null;
  loan_duration: number | null;
  repay_schedule_cd: number | null;
  repay_schedule: string | null;
  moratorium_days: number | null;
  first_due_date: string | null;
  approval_date: string;
  approved_by: number;
  approver_name: string;
  approval_status_cd: number; // 1 Approved, 2 Rejected, 3 Revision
  approval_status: string;
  remarks: string | null;
  appl_status_cd: number;
  appl_status: string;
  branch_id: number;
  branch_name: string;
  fo_id: number | null;
  fo_name: string | null;
  loan_account_id: number | null;
  loan_account_no: string | null;
};

export type LoanApprovalListQuery = {
  page?: number;
  per_page?: number;
  pending_only?: boolean;
  approval_status_cd?: number;
  application_id?: number;
  loan_approval_id?: number;
  branch_id?: number;
  from_date?: string;
  to_date?: string;
  keyword?: string;
};

export type LoanApprovalAddInput = {
  loan_application_id: number;
  approval_status_cd: number; // 1 Approved, 2 Rejected, 3 Revision
  sanctioned_amount?: number;
  interest_rate?: number;
  loan_duration?: number;
  repay_schedule_cd?: number;
  moratorium_days?: number;
  first_due_date?: string;
  remarks?: string;
};

export type LoanApprovalAddResult = {
  loan_approval_id: number;
  loan_application_id: number;
  approval_status_cd: number;
  approval_status: string;
  sanctioned_amount: number | null;
  interest_rate: number | null;
  loan_duration: number | null;
  loan_account?: {
    loan_account_id: number;
    loan_account_no: string;
    loan_amount: number;
    disbursed_amount: number;
    installment_amount: number;
    next_due_date: string | null;
    ln_status: string;
  } | null;
  schedule_summary?: {
    loan_account_id: number;
    installments: number;
    installment_amount: number;
    final_due_date: string;
    message: string;
  } | null;
};
