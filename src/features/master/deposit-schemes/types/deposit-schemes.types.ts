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

export type DepositSchemeDto = {
  scheme_id: number;
  scheme_code: string;
  scheme_name: string;
  deposit_type_cd: number;
  deposit_type_desc?: string | null;
  prod_type_cd: number;
  prod_type_desc?: string | null;
  roi_percent?: number | null;
  intt_type_cd?: number | null;
  intt_type_desc?: string | null;
  intt_payout_cd?: number | null;
  intt_payout_desc?: string | null;
  min_balance?: number | null;
  withd_allow?: boolean | null;
  max_withd_amt?: number | null;
  inop_days?: number | null;
  prn_ledger?: number | null;
  prn_ledger_code?: string | null;
  prn_ledger_name?: string | null;
  prn_ledger_type?: string | number | null;
  prn_ledger_mainhd_id?: number | null;
  prn_ledger_mainhd_name?: string | null;
  prn_ledger_is_active?: boolean | null;
  intt_ledg?: number | null;
  intt_ledger_code?: string | null;
  intt_ledger_name?: string | null;
  intt_ledger_type?: string | number | null;
  intt_ledger_mainhd_id?: number | null;
  intt_ledger_mainhd_name?: string | null;
  intt_ledger_is_active?: boolean | null;
  field_coll?: boolean | null;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string | null;
  updated_by?: number | null;
  updated_at?: string | null;
};

export type DepositSchemeSetup = {
  id: number;
  schemeCode: string;
  schemeName: string;
  depositTypeCd: number;
  depositTypeDesc: string;
  prodTypeCd: number;
  prodTypeDesc: string;
  roiPercent: number | null;
  inttTypeCd: number | null;
  inttTypeDesc: string | null;
  inttPayoutCd: number | null;
  inttPayoutDesc: string | null;
  minBalance: number | null;
  withdAllow: boolean;
  maxWithdAmt: number | null;
  inopDays: number | null;
  prnLedger: number | null;
  prnLedgerCode: string | null;
  prnLedgerName: string | null;
  inttLedg: number | null;
  inttLedgerCode: string | null;
  inttLedgerName: string | null;
  fieldColl: boolean;
  isActive: boolean;
  createdBy?: number | null;
  createdAt?: string | null;
  updatedBy?: number | null;
  updatedAt?: string | null;
};

export type DepositSchemeSetupSaveInput = {
  schemeId?: number;
  schemeName: string;
  depositTypeCd: number;
  prodTypeCd: number;
  roiPercent?: number | null;
  inttTypeCd?: number | null;
  inttPayoutCd?: number | null;
  minBalance?: number | null;
  withdAllow?: boolean;
  maxWithdAmt?: number | null;
  inopDays?: number | null;
  prnLedger?: number | null;
  inttLedg?: number | null;
  fieldColl?: boolean;
  isActive?: boolean;
};

export type DepositSchemeListQuery = {
  page?: number;
  perPage?: number;
  schemeId?: number;
  search?: string;
  depositTypeCd?: number;
  prodTypeCd?: number;
  isActive?: number;
};

export type DepositSchemeListResult = {
  items: DepositSchemeSetup[];
  meta: PaginationMeta | null;
};

export type DepositSchemeCharge = {
  id: number;
  schemeId: number;
  schemeCode: string;
  schemeName: string;
  chargesId: number;
  chargeName: string;
  chargeRate: number | null;
  figureCd: number | null;
  figureDesc: string;
  maxAmount?: number | null;
  taxPercent?: number | null;
  chargesDuringCd?: number | null;
  chargesDuringDesc?: string;
  chargesGl?: number | null;
  chargesGlCode?: string | null;
  chargesGlName?: string | null;
  chargeIsActive: boolean;
  isActive: boolean;
  createdBy?: number | null;
  createdAt?: string | null;
};

export type DepositSchemeChargeSaveInput = {
  schemeId: number;
  chargesIds: number[];
  /** Edit replaces the scheme's active charges. Add only inserts or reactivates. */
  mode: "create" | "edit";
};

export type DepositSchemeChargeAssignSummary = {
  inserted: number;
  reactivated: number;
  deactivated: number;
  unchanged: number;
};

export type DepositSchemeChargeAssignResult = {
  schemeId: number;
  summary: DepositSchemeChargeAssignSummary;
  charges: DepositSchemeCharge[];
};

export type DepositSchemeChargeListQuery = {
  page?: number;
  perPage?: number;
  id?: number;
  schemeId?: number;
  chargesId?: number;
  isActive?: number;
  includeDetails?: boolean;
};

export type DepositSchemeChargeListResult = {
  items: DepositSchemeCharge[];
  meta: PaginationMeta | null;
};
