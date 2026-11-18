export type DepositSchemeSlabDto = {
  id: number;
  scheme_id: number;
  scheme_code?: string | null;
  scheme_name?: string | null;
  min_duration: number;
  max_duration: number;
  term_cd: number;
  term_desc?: string | null;
  roi: number | string;
  lock_period?: number | null;
  effect_frm: string;
  effect_upto?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string | null;
};

export type DepositSchemeSlab = {
  id: number;
  schemeId: number;
  schemeCode: string;
  schemeName: string;
  minDuration: number;
  maxDuration: number;
  termCd: number;
  termDesc: string;
  roi: number;
  lockPeriod: number | null;
  effectFrm: string;
  effectUpto: string | null;
  isActive: boolean;
  createdBy?: number | null;
  createdAt?: string | null;
};

export type DepositSchemeSlabSaveInput = {
  id?: number;
  schemeId: number;
  minDuration: number;
  maxDuration: number;
  termCd: number;
  roi: number;
  lockPeriod?: number | null;
  effectFrm: string;
  effectUpto?: string | null;
  isActive?: boolean;
};

export type DepositSchemeSlabListQuery = {
  page?: number;
  perPage?: number;
  id?: number;
  schemeId?: number;
  termCd?: number;
  duration?: number;
  effectiveOn?: string;
  isActive?: number;
  search?: string;
};

export type PaginationMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  hasMore?: boolean;
};

export type DepositSchemeSlabListResult = {
  items: DepositSchemeSlab[];
  meta: PaginationMeta | null;
};
