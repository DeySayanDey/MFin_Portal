export type ChargeKind = "deposit" | "loan";

/** Shared charge row for deposit (`mst_deposit_charges`) and loan (`mst_loan_charges`). */
export type ChargeSetup = {
  chargeId: number;
  chargeName: string;
  chargeType: number | null;
  chargeTypeDesc: string;
  chargeRate: number | null;
  figureCd: number | null;
  figureDesc: string;
  maxAmount: number | null;
  taxPercent: number;
  duringCd: number | null;
  duringDesc: string;
  chargesGl: number | null;
  chargesGlCode: string | null;
  chargesGlName: string | null;
  isRefundable: boolean;
  isAdjustable: boolean | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string | null;
};

export type ChargeSetupDto = {
  charge_id: number;
  charge_name: string;
  type_cd?: number | string | null;
  type_desc?: string | null;
  charge_rate: number | string;
  figure_cd: number;
  figure_desc?: string | null;
  max_amount?: number | string | null;
  tax_prcent?: number | string | null;
  charges_during_cd?: number | null;
  charges_during_desc?: string | null;
  deduct_during_cd?: number | null;
  deduct_during_desc?: string | null;
  charges_gl?: number | null;
  charges_gl_code?: string | null;
  charges_gl_name?: string | null;
  is_refundable?: boolean | number | null;
  is_adjustable?: boolean | number | string | null;
  is_active?: boolean | number | null;
  created_by?: number | null;
  created_at?: string | null;
};

export type ChargeSetupSaveInput = {
  chargeId?: number;
  chargeName: string;
  chargeType?: number | null;
  chargeRate: number;
  figureCd: number;
  maxAmount?: number | null;
  taxPercent?: number | null;
  duringCd: number;
  chargesGl?: number | null;
  isRefundable?: boolean;
  isAdjustable?: boolean;
  isActive?: boolean;
};

export type ChargeSetupListQuery = {
  page?: number;
  perPage?: number;
  chargeId?: number;
  search?: string;
  figureCd?: number;
  duringCd?: number;
  isRefundable?: boolean;
  isActive?: number;
};

export type ChargeSetupPagination = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  hasMore: boolean;
};

export type ChargeSetupListResult = {
  items: ChargeSetup[];
  meta: ChargeSetupPagination | null;
};
