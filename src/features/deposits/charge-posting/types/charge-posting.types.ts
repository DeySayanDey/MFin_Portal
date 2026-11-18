export type ChargeMode = "single" | "bulk";

/** One applicable charge for one savings account, as calculated by the backend. */
export type ChargeRow = {
  rowKey: string;
  accountId: number;
  fullAccountNo: string;
  applNo: string;
  holderName: string;
  schemeId: number | null;
  schemeCode: string;
  schemeName: string;
  branchName: string;
  balance: number | null;
  availableBalance: number | null;
  chargeId: number;
  chargeName: string;
  /** 1 fixed amount, 2 percentage of balance (option group 16). */
  figureCd: number | null;
  chargeRate: number | null;
  maxAmount: number | null;
  taxPercent: number;
  duringDesc: string;
  lastChargedDate: string;
  chargedThisPeriod: boolean;
  calculatedAmount: number;
};

export type ChargeCalcQuery = {
  mode: ChargeMode;
  chargeDate: string;
  accountId?: number;
  chargeId?: number;
  schemeId?: number;
  branchId?: number;
  keyword?: string;
};

export type ChargeCalcResult = {
  items: ChargeRow[];
  total: number;
};

export type ChargePostRow = {
  accountId: number;
  chargeId: number;
  calculatedAmount: number;
  chargeAmount: number;
};

export type ChargePostInput = {
  mode: ChargeMode;
  chargeDate: string;
  remarks?: string;
  rows: ChargePostRow[];
};

export type ChargePostResult = {
  batchId: number;
  batchNo: string;
  postedCount: number;
  totalCharge: number;
  totalTax: number;
  message: string;
};
