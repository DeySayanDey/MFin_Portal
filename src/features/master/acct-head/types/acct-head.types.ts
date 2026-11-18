/**
 * Account Main Head — Laravel AcctHeadList / Add / Edit.
 */

export type AcctHeadDto = {
  mainhd_id: number;
  mainhd_code: string;
  mainhd_name: string;
  categ_id: number;
  categ_code?: string | null;
  categ_name?: string | null;
  categy_type?: string | null;
  is_active: boolean;
};

export type AcctHead = {
  mainhdId: number;
  mainhdCode: string;
  mainhdName: string;
  categId: number;
  categCode: string | null;
  categName: string | null;
  categoryType: string | null;
  isActive: boolean;
};

export type AcctHeadListQuery = {
  page?: number;
  perPage?: number;
  mainhdId?: number;
  categId?: number;
  keyword?: string;
  /** 1 / 0 — maps to `is_active` / `status` */
  isActive?: number;
};

export type PaginationMetaDto = {
  total: number;
  page: number;
  per_page: number;
  last_page: number;
  has_more: boolean;
};

export type PaginationMeta = {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  hasMore: boolean;
};

export type AcctHeadListResult = {
  items: AcctHead[];
  meta: PaginationMeta | null;
};

export type AcctHeadCreateInput = {
  mainhdName: string;
  categId: number;
  mainhdCode?: string | null;
  isActive?: boolean;
};

export type AcctHeadCreateDto = {
  mainhd_name: string;
  categ_id: number;
  mainhd_code?: string | null;
  is_active?: boolean;
};

export type AcctHeadUpdateInput = {
  mainhdId: number;
  mainhdName: string;
  categId: number;
  mainhdCode?: string | null;
  isActive?: boolean;
};

export type AcctHeadUpdateDto = {
  mainhd_id: number;
  mainhd_name: string;
  categ_id: number;
  mainhd_code?: string | null;
  is_active?: boolean;
};

export const ACCT_HEAD_DEFAULT_PER_PAGE = 50;
export const ACCT_HEAD_MAX_PER_PAGE = 200;
