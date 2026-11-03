export type Member360Profile = {
  memberId: number;
  memberCode: string;
  refCode: string;
  memberName: string;
  fatherName: string;
  spouseName: string;
  genderDesc: string;
  dateOfBirth: string;
  age: number | null;
  mobileNo: string;
  alternateMobileNo: string;
  emailId: string;
  panMasked: string;
  address: string;
  branchId: number | null;
  branchName: string;
  centerName: string;
  foName: string;
  joiningDate: string;
  occupation: string;
  monthlyIncome: number | null;
  statusCd: number;
  statusDesc: string;
};

/** 0 pending, 1 verified, 2 rejected — same codes as `mst_member_kyc.KYC_Verified`. */
export type Member360KycStatus = 0 | 1 | 2;

export type Member360KycDocument = {
  kycId: number;
  docTypeDesc: string;
  kycNoMasked: string;
  verifyStatus: Member360KycStatus;
  expiryDate: string;
  isExpired: boolean;
};

export type Member360Group = {
  groupId: number;
  groupCode: string;
  groupName: string;
  memberRole: string;
  joinDate: string;
  exitDate: string;
  isActive: boolean;
};

export type Member360Nominee = {
  name: string;
  relationDesc: string;
  sharePercent: number | null;
};

export type Member360Shares = {
  totalShares: number;
  faceValue: number;
  totalAmount: number;
  paidAmount: number;
  pendingShares: number;
  lastSubscriptionDate: string;
};

export type Member360HolderRole = "primary" | "joint" | "group";

export type Member360Deposit = {
  accountId: number;
  depositTypeCd: number;
  fullAccountNo: string;
  applNo: string;
  schemeName: string;
  holderRole: Member360HolderRole;
  openDate: string;
  balance: number | null;
  maturityDate: string;
  maturityAmount: number | null;
  statusCd: number;
  statusDesc: string;
  isClosed: boolean;
};

export type Member360Loan = {
  loanAccountId: number;
  loanAccountNo: string;
  applicationNo: string;
  schemeName: string;
  borrowerRole: Member360HolderRole;
  groupName: string;
  loanDate: string;
  loanAmount: number;
  disbursedAmount: number;
  outstanding: number;
  overdueAmount: number;
  overdueDays: number;
  nextDueDate: string;
  nextDueAmount: number | null;
  statusCd: number;
  statusDesc: string;
  isClosed: boolean;
  isNpa: boolean;
};

export type Member360Application = {
  applicationId: number;
  applicationNo: string;
  applicationDate: string;
  schemeName: string;
  amount: number;
  statusDesc: string;
};

export type Member360ActivityModule = "savings" | "term" | "loan" | "share";

export type Member360Activity = {
  key: string;
  date: string;
  module: Member360ActivityModule;
  reference: string;
  description: string;
  credit: number;
  debit: number;
};

export type Member360Totals = {
  savingsBalance: number;
  termBalance: number;
  loanOutstanding: number;
  loanOverdue: number;
  openDeposits: number;
  activeLoans: number;
};

export type Member360 = {
  profile: Member360Profile;
  kyc: Member360KycDocument[];
  groups: Member360Group[];
  nominees: Member360Nominee[];
  shares: Member360Shares;
  deposits: Member360Deposit[];
  loans: Member360Loan[];
  applications: Member360Application[];
  activity: Member360Activity[];
  totals: Member360Totals;
};
