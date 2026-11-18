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

export type LoanSchemeSetup = {
  id: number;
  schemeCode: string;
  schemeName: string;
  productTypeCd: number;
  productTypeDesc: string;
  repayTypeCd: number;
  repayTypeDesc: string;
  roiPercent: number;
  inttTypeCd: number;
  inttTypeDesc: string;
  repayScheduleCd: number;
  repayScheduleDesc: string;
  isInttCapitalisation: boolean;
  capitalisationOnCd: number | null;
  capitalisationOnDesc: string;
  isIncentive: boolean;
  incentiveDay: number | null;
  incentiveRate: number | null;
  isOverdue: boolean;
  repayGraceDays: number | null;
  overdueOnCd: number | null;
  overdueOnDesc: string;
  overdurRate: number | null;
  isNpa: boolean;
  npaAfterDays: number | null;
  isMortgageReqd: boolean;
  isGuarantorReqd: boolean;
  loanLedger: number | null;
  loanLedgerCode: string | null;
  loanLedgerName: string | null;
  inttLedger: number | null;
  inttLedgerCode: string | null;
  inttLedgerName: string | null;
  odinttLedger: number | null;
  odinttLedgerCode: string | null;
  odinttLedgerName: string | null;
  fieldCollAllow: boolean;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string | null;
  updatedBy: number | null;
  updatedAt: string | null;
};

export type LoanSchemeSetupSaveInput = {
  schemeId?: number;
  schemeName: string;
  productTypeCd: number;
  repayTypeCd: number;
  roiPercent: number;
  inttTypeCd: number;
  repayScheduleCd: number;
  isInttCapitalisation?: boolean;
  capitalisationOnCd?: number | null;
  isIncentive?: boolean;
  incentiveDay?: number | null;
  incentiveRate?: number | null;
  isOverdue?: boolean;
  repayGraceDays?: number | null;
  overdueOnCd?: number | null;
  overdurRate?: number | null;
  isNpa?: boolean;
  npaAfterDays?: number | null;
  isMortgageReqd?: boolean;
  isGuarantorReqd?: boolean;
  loanLedger?: number | null;
  inttLedger?: number | null;
  odinttLedger?: number | null;
  fieldCollAllow?: boolean;
  isActive?: boolean;
};

export type LoanSchemeListQuery = {
  page?: number;
  perPage?: number;
  schemeId?: number;
  search?: string;
  productTypeCd?: number;
  repayTypeCd?: number;
  isActive?: number;
};

export type LoanSchemeListResult = {
  items: LoanSchemeSetup[];
  meta: PaginationMeta | null;
};

export type LoanSchemeCharge = {
  id: number;
  schemeId: number;
  schemeCode: string;
  schemeName: string;
  chargeId: number;
  chargeName: string;
  chargeRate: number | null;
  figureCd: number | null;
  figureDesc: string;
  maxAmount: number | null;
  taxPercent: number;
  deductDuringCd: number | null;
  deductDuringDesc: string;
  chargesGl: number | null;
  chargesGlCode: string | null;
  chargesGlName: string | null;
  chargeIsActive: boolean;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string | null;
};

export type LoanSchemeChargeSaveInput = {
  schemeId: number;
  chargeIds: number[];
  /** Edit replaces the scheme's active charges. Add only inserts or reactivates. */
  mode: "create" | "edit";
};

export type LoanSchemeChargeAssignSummary = {
  inserted: number;
  reactivated: number;
  deactivated: number;
  unchanged: number;
};

export type LoanSchemeChargeAssignResult = {
  schemeId: number;
  summary: LoanSchemeChargeAssignSummary;
  charges: LoanSchemeCharge[];
};

export type LoanSchemeChargeListQuery = {
  page?: number;
  perPage?: number;
  id?: number;
  schemeId?: number;
  chargeId?: number;
  isActive?: number;
};

export type LoanSchemeChargeListResult = {
  items: LoanSchemeCharge[];
  meta: PaginationMeta | null;
};
