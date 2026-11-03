export type DashboardQuery = {
  fromDate: string;
  toDate: string;
  branchId?: number;
};

export type DashboardKpis = {
  glp: number;
  disbursed: number;
  par90Amount: number;
  par90Percent: number;
  npaAmount: number;
  npaPercent: number;
  activeGroups: number;
  activeMembers: number;
  savingsBalance: number;
  pendingApplications: number;
  collection: number;
};

export type DashboardFunds = {
  cash: number;
  bank: number;
  total: number;
};

export type DashboardAgent = {
  staffId: number;
  staffName: string;
  groupCount: number;
  target: number;
  collected: number;
  wallet: number;
  inField: boolean;
};

export type DashboardBranch = {
  branchId: number;
  branchName: string;
  loanBook: number;
  collection: number;
  vault: number;
  recoveryPercent: number | null;
};

export type DashboardLoan = {
  loanAccountId: number;
  loanAccountNo: string;
  borrower: string;
  groupName: string;
  disbursed: number;
  principalPaid: number;
  outstanding: number;
  dpd: number;
  statusCd: number | null;
  statusDesc: string;
};

export type DashboardSnapshot = {
  fromDate: string;
  toDate: string;
  branchId: number | null;
  kpis: DashboardKpis;
  funds: DashboardFunds;
  agents: DashboardAgent[];
  branches: DashboardBranch[];
  loans: DashboardLoan[];
};
