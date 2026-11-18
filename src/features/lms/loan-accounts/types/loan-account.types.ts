export type LoanAccountSanction = {
  loanApprovalId: number;
  sanctionedAmount: number;
  interestRate: number;
  loanDuration: number;
  firstDueDate: string | null;
  approvalDate: string;
};

export type LoanAccount = {
  loanAccountId: number;
  loanAccountNo: number;
  refAccountNo: string;
  applicationId: number;
  applicationNo: string;
  applicationDate: string;
  applAmount: number;
  applTenure: number;
  repayDurationCd: number;
  repayDurationDesc: string;
  loanCycle: number;
  custTypeCd: number;
  custTypeDesc: string;
  custIdPrimary: number;
  primaryRefCode: string;
  primaryName: string;
  primaryMobile: string | null;
  custIdJoint1: number | null;
  joint1Name: string | null;
  custIdJoint2: number | null;
  joint2Name: string | null;
  beneficiaryName: string | null;
  schemeId: number;
  schemeCode: string;
  schemeName: string;
  schemeRoiPercent: number;
  sanction: LoanAccountSanction | null;
  loanDate: string;
  loanAmount: number;
  interestRate: number;
  disbursedAmount: number;
  undisbursedAmount: number;
  principalOutstanding: number;
  disbursementCount: number;
  finalDueDate: string | null;
  isDefaulter: boolean;
  isNpa: boolean;
  foId: number | null;
  foCode: string | null;
  foName: string | null;
  branchId: number | null;
  branchCode: string;
  branchName: string;
  statusCd: number;
  statusDesc: string;
  isActive: boolean;
  createdBy: number | null;
  createdByName: string;
  createdOn: string;
};

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

export type LoanAccountListQuery = {
  page?: number;
  perPage?: number;
  loanAccountId?: number;
  applicationId?: number;
  branchId?: number;
  foId?: number;
  schemeId?: number;
  custTypeCd?: number;
  memberId?: number;
  groupId?: number;
  statusCd?: number;
  isDefaulter?: boolean;
  isNpa?: boolean;
  fromDate?: string;
  toDate?: string;
  search?: string;
};

export type LoanAccountListResult = {
  items: LoanAccount[];
  meta: PaginationMeta | null;
};
