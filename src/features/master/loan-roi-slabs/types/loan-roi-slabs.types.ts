export type LoanSchemeChoice = {
  id: number;
  schemeCode: string;
  schemeName: string;
  repayScheduleDesc: string;
  isActive: boolean;
};

export type LoanSchemeSlab = {
  id: number;
  schemeId: number;
  schemeCode: string;
  schemeName: string;
  repayScheduleCd: number | null;
  repayScheduleDesc: string;
  schemeIsActive: boolean;
  minAmount: number;
  maxAmount: number;
  roi: number;
  maxDuration: number;
  amtPer1000: number | null;
  effectFrom: string;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string | null;
};

export type LoanSchemeSlabSaveInput = {
  id?: number;
  schemeId: number;
  minAmount: number;
  maxAmount: number;
  roi: number;
  maxDuration: number;
  amtPer1000?: number | null;
  effectFrom: string;
  isActive?: boolean;
};

export type LoanSchemeSlabListQuery = {
  page?: number;
  perPage?: number;
  id?: number;
  schemeId?: number;
  amount?: number;
  effectiveOn?: string;
  isActive?: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  hasMore?: boolean;
};

export type LoanSchemeSlabListResult = {
  items: LoanSchemeSlab[];
  meta: PaginationMeta | null;
};
