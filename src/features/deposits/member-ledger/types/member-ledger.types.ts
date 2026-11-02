export type MemberLedgerMember = {
  memberId: number;
  memberCode: string;
  refCode: string;
  memberName: string;
  mobileNo: string;
  branchId: number | null;
};

export type MemberLedgerAccount = {
  accountId: number;
  holderRole: string;
  fullAccountNo: string;
  applNo: string;
  holderName: string;
  depositTypeCd: number;
  depositTypeDesc: string;
  schemeCode: string;
  schemeName: string;
  prodTypeDesc: string;
  statusCd: number;
  statusDesc: string;
  isClosed: boolean;
  closingDate: string | null;
  currentBalance: number | null;
  instAmount: number | null;
  instNo: number | null;
  maturityDate: string | null;
  maturityAmt: number | null;
};

export type MemberLedgerSection = {
  accountCount: number;
  openAccountCount: number;
  totalBalance: number;
  totalCredit: number;
  totalDebit: number;
  accounts: MemberLedgerAccount[];
};

export type MemberLedger = {
  member: MemberLedgerMember;
  savings: MemberLedgerSection;
  termDeposit: MemberLedgerSection;
};

export type MemberLedgerSummary = {
  fromDate: string | null;
  toDate: string | null;
  openingBalance: number;
  totalCredit: number;
  totalDebit: number;
  closingBalance: number;
  postedCount: number;
  pendingCount: number;
  rejectedCount: number;
};

export type MemberLedgerTransaction = {
  transId: number;
  transNo: string;
  transDate: string;
  transModeDesc: string;
  transTypeDesc: string;
  creditAmount: number;
  debitAmount: number;
  runningBalance: number | null;
  ledgerNarration: string;
  voucherNo: string;
  statusCd: number;
  statusDesc: string;
};

export type MemberLedgerMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  hasMore: boolean;
};

export type MemberLedgerTransactions = {
  summary: MemberLedgerSummary;
  transactions: MemberLedgerTransaction[];
  meta: MemberLedgerMeta;
};

export type MemberLedgerSectionKey = "savings" | "term";

export type MemberLedgerTransactionQuery = {
  memberId: number;
  accountId: number;
  section: MemberLedgerSectionKey;
  fromDate?: string;
  toDate?: string;
  includePending?: boolean;
  sort?: "asc" | "desc";
  page?: number;
  perPage?: number;
};
