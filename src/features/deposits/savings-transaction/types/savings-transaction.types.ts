export type SavingsTransaction = {
  transId: number;
  transNo: string;
  accountId: number;
  applNo: string;
  holderName: string;
  custTypeCd: number | null;
  memberName: string;
  memberRefCode: string;
  accountNo: number | null;
  fullAccountNo: string;
  depositTypeCd: number;
  depositTypeDesc: string;
  schemeCode: string;
  schemeName: string;
  transDate: string;
  effectDate: string;
  transMode: string;
  transModeDesc: string;
  transTypeCd: number;
  transTypeDesc: string;
  transAmount: number;
  balanceAfter: number | null;
  ledgerNarration: string;
  branchName: string;
  foName: string;
  remarks: string;
  statusCd: number;
  statusDesc: string;
  createdBy: number | null;
  createdByName: string;
  createdAt: string | null;
  approvedByName: string;
  approvedAt: string | null;
  voucherId: number | null;
  voucherNo: string;
};

export type SavingsTransactionListQuery = {
  page?: number;
  perPage?: number;
  transId?: number;
  accountId?: number;
  memberId?: number;
  groupId?: number;
  branchId?: number;
  foId?: number;
  depositTypeCd?: number;
  transTypeCd?: number;
  transMode?: string;
  statusCd?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
};

export type SavingsTransactionListResult = {
  items: SavingsTransaction[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  } | null;
};

/** Session details printed in the report header. */
export type SavingsTransactionReportContext = {
  orgName: string;
  branchName: string;
  branchCode: string;
  printedBy: string;
};

export type SavingsTransactionReport = {
  rows: SavingsTransaction[];
  generatedAt: Date;
  /** True when more rows matched than the report limit allows. */
  truncated: boolean;
};

export type SavingsTransactionAddInput = {
  accountId: number;
  transTypeCd: number;
  transAmount: number;
  transMode?: string | null;
  transDate?: string | null;
  effectDate?: string | null;
  foId?: number | null;
  ledgerNarration?: string | null;
  remarks?: string | null;
};

export type SavingsTransactionApproveInput = {
  transId: number;
  approve: boolean;
  remarks?: string | null;
};

export type SavingsTransactionResult = {
  item: SavingsTransaction;
  message: string;
};

export type SavingsCustomerAccount = {
  accountId: number;
  fullAccountNo: string;
  applNo: string;
  holderName: string;
  depositTypeCd: number;
  depositTypeDesc: string;
  schemeCode: string;
  schemeName: string;
  branchId: number | null;
  branchName: string;
  statusCd: number;
  statusDesc: string;
  currentBalance: number | null;
  availableBalance: number | null;
};

export type SavingsCustomer = {
  custTypeCd: number;
  custTypeDesc: string;
  custId: number;
  name: string;
  refCode: string;
  mobileNo: string | null;
  memberId: number | null;
  groupId: number | null;
  accounts: SavingsCustomerAccount[];
};

export type SavingsCustomerListResult = {
  items: SavingsCustomer[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  } | null;
};

export type SavingsCustomerQuery = {
  page?: number;
  perPage?: number;
  keyword?: string;
  custTypeCd?: number;
  depositTypeCd?: number;
  branchId?: number;
};

export type SavingsAccountBalance = {
  accountId: number;
  currentBalance: number | null;
  availableBalance: number | null;
  pendingCount: number;
  canDeposit: boolean;
  canWithdraw: boolean;
  withdrawableAmount: number | null;
  depositRemaining: number | null;
  instAmount: number | null;
  maturityDate: string | null;
  startDate: string | null;
  minBalance: number | null;
  vouchersMissing: number;
  isClosed: boolean;
  statusCd: number;
  statusDesc: string;
};
