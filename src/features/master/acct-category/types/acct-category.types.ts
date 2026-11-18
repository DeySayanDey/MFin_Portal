/**
 * Account Category — Laravel AcctCategoryList / Add / Edit.
 */

export type AcctCategoryDto = {
  categ_id: number;
  categ_code: string;
  categ_name: string;
  categy_type?: string | null;
  head_count?: number | null;
};

export type AcctCategory = {
  categId: number;
  categCode: string;
  categName: string;
  categoryType: string | null;
  headCount: number;
};

export type AcctCategoryListQuery = {
  page?: number;
  perPage?: number;
  categId?: number;
  keyword?: string;
  categoryType?: string;
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

export type AcctCategoryListResult = {
  items: AcctCategory[];
  meta: PaginationMeta | null;
};

export type AcctCategoryCreateInput = {
  categName: string;
  categCode?: string | null;
  categoryType: string;
};

export type AcctCategoryCreateDto = {
  categ_name: string;
  categ_code?: string | null;
  categy_type: string;
};

export type AcctCategoryUpdateInput = {
  categId: number;
  categName: string;
  categCode?: string | null;
  categoryType: string;
};

export type AcctCategoryUpdateDto = {
  categ_id: number;
  categ_name: string;
  categ_code?: string | null;
  categy_type: string;
};

/** GL category type codes (2 chars) — Credit / Debit only. */
export const ACCT_CATEGORY_TYPE_OPTIONS = ["CR", "DR"] as const;

export type AcctCategoryTypeCode = (typeof ACCT_CATEGORY_TYPE_OPTIONS)[number];

export const ACCT_CATEGORY_DEFAULT_PER_PAGE = 50;
export const ACCT_CATEGORY_MAX_PER_PAGE = 200;
