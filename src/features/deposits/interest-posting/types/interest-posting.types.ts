export type InterestMode = "single" | "bulk";

/** One savings account with interest worked out for `fromDate`..`toDate`. */
export type InterestRow = {
  accountId: number;
  fullAccountNo: string;
  applNo: string;
  holderName: string;
  schemeId: number | null;
  schemeCode: string;
  schemeName: string;
  branchName: string;
  balance: number | null;
  roi: number;
  inttTypeDesc: string;
  lastPostedDate: string;
  fromDate: string;
  toDate: string;
  days: number;
  productAmount: number | null;
  calculatedInterest: number;
};

export type InterestCalcQuery = {
  mode: InterestMode;
  asOnDate: string;
  accountId?: number;
  schemeId?: number;
  branchId?: number;
  keyword?: string;
};

export type InterestCalcResult = {
  items: InterestRow[];
  /** Accounts matching the filters; can exceed `items.length` when the list is capped. */
  total: number;
};

export type InterestPostRow = {
  accountId: number;
  fromDate: string;
  toDate: string;
  calculatedInterest: number;
  interestAmount: number;
};

export type InterestPostInput = {
  mode: InterestMode;
  asOnDate: string;
  postingDate: string;
  remarks?: string;
  rows: InterestPostRow[];
};

export type InterestPostResult = {
  batchId: number;
  batchNo: string;
  postedCount: number;
  totalInterest: number;
  message: string;
};
