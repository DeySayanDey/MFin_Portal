/**
 * Account Subledger — Laravel AcctSubledgerList / Add / Edit.
 */

export type AcctSubledgerDto = {
  subledg_id: number;
  subledg_code: string;
  subledg_name: string;
  ledger_id: number;
  ledger_code?: string | null;
  ledger_name?: string | null;
  mainhd_id?: number | null;
  mainhd_code?: string | null;
  mainhd_name?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string | null;
  branch_count?: number | null;
};

export type AcctSubledger = {
  subledgId: number;
  subledgCode: string;
  subledgName: string;
  ledgerId: number;
  ledgerCode: string | null;
  ledgerName: string | null;
  mainhdId: number | null;
  mainhdCode: string | null;
  mainhdName: string | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string | null;
  branchCount: number;
};

export type AcctSubledgerListQuery = {
  page?: number;
  perPage?: number;
  subledgId?: number;
  ledgerId?: number;
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

export type AcctSubledgerListResult = {
  items: AcctSubledger[];
  meta: PaginationMeta | null;
};

export type AcctSubledgerCreateInput = {
  subledgName: string;
  ledgerId: number;
  subledgCode?: string | null;
  isActive?: boolean;
};

export type AcctSubledgerCreateDto = {
  subledg_name: string;
  ledger_id: number;
  subledg_code?: string | null;
  is_active?: boolean;
};

export type AcctSubledgerUpdateInput = {
  subledgId: number;
  subledgName: string;
  ledgerId: number;
  subledgCode?: string | null;
  isActive?: boolean;
};

export type AcctSubledgerUpdateDto = {
  subledg_id: number;
  subledg_name: string;
  ledger_id: number;
  subledg_code?: string | null;
  is_active?: boolean;
};

export const ACCT_SUBLEDGER_DEFAULT_PER_PAGE = 50;
export const ACCT_SUBLEDGER_MAX_PER_PAGE = 200;
