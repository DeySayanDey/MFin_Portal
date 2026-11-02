export type PaginationMeta = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
};

export type PaginationMetaDto = {
  total: number;
  page?: number;
  per_page?: number;
  last_page?: number;
  has_more?: boolean;
};

export type DepositAccountDto = {
  account_id: number;
  appl_no: string;
  appl_date: string;
  deposit_type_cd: number;
  deposit_type_desc?: string | null;
  scheme_id: number;
  scheme_code?: string | null;
  scheme_name?: string | null;
  scheme_roi_percent?: number | null;
  special_catg_cd?: number | null;
  special_catg_desc?: string | null;
  cust_type_cd: number;
  cust_type_desc?: string | null;
  cust_id_primary: number;
  primary_ref_code?: string | null;
  primary_name?: string | null;
  primary_mobile?: string | null;
  cust_id_joint1?: number | null;
  joint1_ref_code?: string | null;
  joint1_name?: string | null;
  cust_id_joint2?: number | null;
  joint2_ref_code?: string | null;
  joint2_name?: string | null;
  holder_name?: string | null;
  op_mode_cd: number;
  op_mode_desc?: string | null;
  nom_regd?: boolean | null;
  nominee_count?: number | null;
  signatory_count?: number | null;
  account_no?: number | null;
  full_account_no?: string | null;
  prod_type_cd?: number | null;
  prod_type_desc?: string | null;
  member_count?: number | null;
  ref_ac_no?: string | null;
  start_date?: string | null;
  current_balance?: number | null;
  closing_date?: string | null;
  closing_reason?: string | null;
  is_closed?: boolean | null;
  fo_id?: number | null;
  fo_code?: string | null;
  fo_name?: string | null;
  branch_id?: number | null;
  branch_code?: string | null;
  branch_name?: string | null;
  status_cd: number;
  status_desc?: string | null;
  is_active?: boolean | null;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at?: string | null;
  sb?: {
    start_date?: string | null;
    account_no?: number | null;
    ref_ac_no?: string | null;
    cbs_ac_no?: string | null;
    roi?: number | null;
    opening_deposit?: number | null;
    current_balance?: number | null;
    available_balance?: number | null;
  } | null;
  td?: {
    start_date?: string | null;
    account_no?: number | null;
    ref_ac_no?: string | null;
    period_yy?: number | null;
    period_mm?: number | null;
    period_dd?: number | null;
    roi?: number | null;
    inst_no?: number | null;
    inst_amount?: number | null;
    maturity_date?: string | null;
    maturity_amt?: number | null;
    intt_payable_amt?: number | null;
    matu_ins_desc?: string | null;
    current_balance?: number | null;
  } | null;
};

export type DepositAccountTerm = {
  startDate: string | null;
  accountNo: number | null;
  refAcNo: string | null;
  periodYy: number | null;
  periodMm: number | null;
  periodDd: number | null;
  roi: number | null;
  instNo: number | null;
  instAmount: number | null;
  maturityDate: string | null;
  maturityAmount: number | null;
  interestPayable: number | null;
  maturityInstruction: string;
  currentBalance: number | null;
};

export type DepositAccount = {
  accountId: number;
  applNo: string;
  applDate: string;
  depositTypeCd: number;
  depositTypeDesc: string;
  schemeId: number;
  schemeCode: string;
  schemeName: string;
  schemeRoiPercent: number | null;
  specialCatgCd: number | null;
  specialCatgDesc: string;
  custTypeCd: number;
  custTypeDesc: string;
  custIdPrimary: number;
  primaryRefCode: string;
  primaryName: string;
  primaryMobile: string | null;
  custIdJoint1: number | null;
  joint1RefCode: string;
  joint1Name: string;
  custIdJoint2: number | null;
  joint2RefCode: string;
  joint2Name: string;
  holderName: string;
  opModeCd: number;
  opModeDesc: string;
  nomRegd: boolean;
  nomineeCount: number;
  signatoryCount: number;
  accountNo: number | null;
  fullAccountNo: string | null;
  prodTypeCd: number | null;
  prodTypeDesc: string;
  memberCount: number | null;
  refAcNo: string | null;
  startDate: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  closingDate: string | null;
  closingReason: string | null;
  isClosed: boolean;
  foId: number | null;
  foCode: string;
  foName: string;
  branchId: number | null;
  branchCode: string;
  branchName: string;
  statusCd: number;
  statusDesc: string;
  isActive: boolean;
  createdBy: number | null;
  createdByName: string;
  createdAt: string | null;
  cbsAcNo: string | null;
  openingDeposit: number | null;
  sbRoi: number | null;
  td: DepositAccountTerm | null;
};

export type DepositAccountSbInput = {
  startDate?: string | null;
  accountNo?: number | null;
  refAcNo?: string | null;
  cbsAcNo?: string | null;
  roi?: number | null;
  openingDeposit?: number | null;
};

export type DepositAccountListQuery = {
  page?: number;
  perPage?: number;
  accountId?: number;
  branchId?: number;
  foId?: number;
  schemeId?: number;
  depositTypeCd?: number;
  prodTypeCd?: number;
  custTypeCd?: number;
  memberId?: number;
  groupId?: number;
  opModeCd?: number;
  statusCd?: number;
  isClosed?: boolean;
  fromDate?: string;
  toDate?: string;
  search?: string;
  /** When true, the list is not limited to savings accounts. */
  allTypes?: boolean;
};

export type DepositAccountListResult = {
  items: DepositAccount[];
  meta: PaginationMeta | null;
};

export type DepositAccountCreateInput = {
  applDate: string;
  schemeId: number;
  custTypeCd: number;
  custIdPrimary: number;
  opModeCd: number;
  applNo?: string | null;
  specialCatgCd?: number | null;
  custIdJoint1?: number | null;
  custIdJoint2?: number | null;
  holderName?: string | null;
  nomRegd?: boolean;
  foId?: number | null;
  branchId?: number | null;
  statusCd?: number;
  sb?: DepositAccountSbInput;
};

export type DepositAccountEditInput = {
  accountId: number;
  applDate?: string;
  schemeId?: number;
  custTypeCd?: number;
  custIdPrimary?: number;
  opModeCd?: number;
  applNo?: string | null;
  specialCatgCd?: number | null;
  custIdJoint1?: number | null;
  custIdJoint2?: number | null;
  holderName?: string | null;
  nomRegd?: boolean;
  foId?: number | null;
  branchId?: number | null;
  sb?: DepositAccountSbInput;
};

export type DepositAccountStatusInput = {
  accountId: number;
  statusCd: number;
};

export type DepositAccountCloseInput = {
  accountId: number;
  closingReason: string;
  closingDate?: string;
};

export type DepositCustomerKind = "member" | "group";

export type DepositCustomer = {
  id: number;
  name: string;
  refCode: string;
  mobile: string | null;
  branchId: number | null;
  branchCode: string;
  branchName: string;
  foId: number | null;
  foCode: string;
  foName: string;
  anchorDate: string | null;
  dateOfBirth: string | null;
  kycPendingCount: number;
};

export type DepositCustomerQuery = {
  kind: DepositCustomerKind;
  keyword?: string;
  branchId?: number;
  page?: number;
  perPage?: number;
};

export type DepositNomineeAddItem = {
  nomCustId?: number | null;
  nomName?: string | null;
  relationCd: number;
  contactNo?: string | null;
  birthDate?: string | null;
  age?: number | null;
  address?: string | null;
  guardianName?: string | null;
  sharePercent?: number | null;
};

export type DepositNomineeAddInput = {
  accountId: number;
  nominees: DepositNomineeAddItem[];
};

export type DepositNomineeShare = {
  activeCount: number;
  accountTotalShare: number;
};

export type DepositNominee = {
  nomineeId: number;
  accountId: number;
  nomCustId: number | null;
  nomCustRefCode: string;
  nomName: string;
  contactNo: string;
  relationCd: number;
  relationDesc: string;
  age: number | null;
  birthDate: string | null;
  address: string;
  guardianName: string;
  sharePercent: number | null;
  isActive: boolean;
  isMinor?: boolean;
};

export type DepositNomineeEditInput = {
  nomineeId: number;
  nomCustId?: number | null;
  nomName?: string | null;
  relationCd?: number;
  contactNo?: string | null;
  birthDate?: string | null;
  age?: number | null;
  address?: string | null;
  guardianName?: string | null;
  sharePercent?: number | null;
};

export type DepositNomineeStatusInput = {
  nomineeId: number;
  isActive: boolean;
};

export type DepositNomineeSave = {
  add: DepositNomineeAddItem[];
  edit: DepositNomineeEditInput[];
  deactivate: DepositNomineeStatusInput[];
};

export type SignatoryCandidate = DepositCustomer & { role: string };

export type DepositSignatory = {
  signatoryId: number;
  accountId: number;
  custId: number;
  custRefCode: string;
  custName: string;
  custMobile: string | null;
  signatoryRole: string;
  signFileNm: string;
  photoFileNm: string;
  isActive: boolean;
};

export type DepositSignatoryAddItem = {
  custId: number;
  signFileNm?: string | null;
  photoFileNm?: string | null;
};

export type DepositSignatoryAddInput = {
  accountId: number;
  signatories: DepositSignatoryAddItem[];
};

export type DepositSignatoryEditInput = {
  signatoryId: number;
  signFileNm?: string | null;
  photoFileNm?: string | null;
};

export type DepositSignatoryStatusInput = {
  signatoryId: number;
  isActive: boolean;
};

export type DepositSignatorySave = {
  add: DepositSignatoryAddItem[];
  edit: DepositSignatoryEditInput[];
  deactivate: DepositSignatoryStatusInput[];
};

export type DepositSchemeOption = {
  schemeId: number;
  schemeCode: string;
  schemeName: string;
  roiPercent: number | null;
  inttTypeCd?: number;
  inttTypeDesc?: string;
  inttPayoutCd?: number;
  inttPayoutDesc?: string;
  minBalance?: number | null;
  withdAllow?: boolean;
  maxWithdAmt?: number | null;
  inopDays?: number | null;
  fieldColl?: boolean;
  isActive?: boolean;
};

export type DepositProductScheme = {
  depositTypeCd: number;
  depositTypeDesc: string;
  optGrpId: number;
  prodTypeCd: number;
  prodTypeDesc: string;
  schemes: DepositSchemeOption[];
};

export type DepositAccountMember = {
  id: number;
  accountId: number;
  memberId: number;
  memberRefCode: string;
  memberName: string;
  mobileNo: string | null;
  groupId: number | null;
  groupName: string | null;
  memberRole: string | null;
  isCurrentMember: boolean;
  openDate: string | null;
  currentBalance: number;
  acStatusCd: number;
  acStatusDesc: string;
  createdBy: number | null;
  createdOn: string | null;
};

export type DepositAccountTransaction = {
  transId: number;
  transNo: string;
  transDate: string;
  effectDate: string;
  transMode: string;
  transModeDesc: string;
  transTypeCd: number;
  transTypeDesc: string;
  transAmount: number;
  balanceAfter: number | null;
  ledgerNarration: string;
  voucherId: number | null;
  voucherNo?: string | null;
  statusCd: number;
  statusDesc: string;
};

export type TermScheduleItem = {
  scheduleId: number;
  instlNo: number;
  dueDate: string;
  instlAmt: number;
  paidDate: string | null;
  paidAmount: number;
  balanceAmount: number;
  daysOverdue: number;
  statusCd: number;
  statusDesc: string;
};

export type TermScheduleSummary = {
  totalInstallments: number;
  paidInstallments: number;
  overdueInstallments: number;
  paidAmount: number;
  balanceAmount: number;
  nextDueDate: string | null;
  nextDueAmount: number | null;
};

export type TermPayoutItem = {
  payoutId: number;
  dueDate: string;
  dueAmount: number;
  paidDate: string | null;
  statusCd: number;
  statusDesc: string;
  voucherNo: string | null;
};

export type DepositAccountViewData = DepositAccount & {
  members: DepositAccountMember[];
  nominees: DepositNominee[];
  signatories: DepositSignatory[];
  transactions: DepositAccountTransaction[];
  transactionCount: number;
  rdSchedule: TermScheduleItem[];
  scheduleSummary: TermScheduleSummary | null;
  misPayouts: TermPayoutItem[];
};
