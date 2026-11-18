/**
 * Subledger ↔ Branch mapping — Laravel AcctSubledgerBranchList / Add / Edit.
 */

export type AcctSubledgerBranchDto = {
  id: number;
  branch_id: number;
  branch_code?: string | null;
  branch_name?: string | null;
  subledg_id: number;
  subledg_code?: string | null;
  subledg_name?: string | null;
  ledger_id?: number | null;
  ledger_code?: string | null;
  ledger_name?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string | null;
};

export type AcctSubledgerBranch = {
  id: number;
  branchId: number;
  branchCode: string | null;
  branchName: string | null;
  subledgId: number;
  subledgCode: string | null;
  subledgName: string | null;
  ledgerId: number | null;
  ledgerCode: string | null;
  ledgerName: string | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string | null;
};

export type AcctSubledgerBranchListQuery = {
  page?: number;
  perPage?: number;
  id?: number;
  subledgId?: number;
  branchId?: number;
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

export type AcctSubledgerBranchListResult = {
  items: AcctSubledgerBranch[];
  meta: PaginationMeta | null;
};

export type AcctSubledgerBranchCreateInput = {
  branchId: number;
  subledgId: number;
  isActive?: boolean;
};

export type AcctSubledgerBranchCreateDto = {
  branch_id: number;
  subledg_id: number;
  is_active?: boolean;
};

export type AcctSubledgerBranchUpdateInput = {
  id: number;
  branchId: number;
  subledgId: number;
  isActive?: boolean;
};

export type AcctSubledgerBranchUpdateDto = {
  id: number;
  branch_id: number;
  subledg_id: number;
  is_active?: boolean;
};

export const ACCT_SUBLEDGER_BRANCH_DEFAULT_PER_PAGE = 50;
export const ACCT_SUBLEDGER_BRANCH_MAX_PER_PAGE = 200;
