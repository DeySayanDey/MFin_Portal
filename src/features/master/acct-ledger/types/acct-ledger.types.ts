/**
 * Account Ledger — Laravel AcctLedgerList / Add / Edit.
 */

export type AcctLedgerDto = {
  ledger_id: number;
  ledger_code: string;
  ledger_name: string;
  ledger_type?: string | number | null;
  adjustable_eligible?: boolean | number | string | null;
  mainhd_id: number;
  mainhd_code?: string | null;
  mainhd_name?: string | null;
  categ_id?: number | null;
  categ_code?: string | null;
  categ_name?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string | null;
  subledger_count?: number | null;
};

export type AcctLedger = {
  ledgerId: number;
  ledgerCode: string;
  ledgerName: string;
  ledgerType: string | null;
  adjustableEligible: boolean | null;
  mainhdId: number;
  mainhdCode: string | null;
  mainhdName: string | null;
  categId: number | null;
  categCode: string | null;
  categName: string | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string | null;
  subledgerCount: number;
};

export type AcctLedgerListQuery = {
  page?: number;
  perPage?: number;
  ledgerId?: number;
  mainhdId?: number;
  keyword?: string;
  ledgerType?: string;
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

export type AcctLedgerListResult = {
  items: AcctLedger[];
  meta: PaginationMeta | null;
};

export type AcctLedgerCreateInput = {
  ledgerName: string;
  mainhdId: number;
  ledgerCode?: string | null;
  ledgerType?: string | number | null;
  isActive?: boolean;
};

export type AcctLedgerCreateDto = {
  ledger_name: string;
  mainhd_id: number;
  ledger_code?: string | null;
  ledger_type?: string | number | null;
  is_active?: boolean;
};

export type AcctLedgerUpdateInput = {
  ledgerId: number;
  ledgerName: string;
  mainhdId: number;
  ledgerCode?: string | null;
  ledgerType?: string | number | null;
  isActive?: boolean;
};

export type AcctLedgerUpdateDto = {
  ledger_id: number;
  ledger_name: string;
  mainhd_id: number;
  ledger_code?: string | null;
  ledger_type?: string | number | null;
  is_active?: boolean;
};

export const ACCT_LEDGER_DEFAULT_PER_PAGE = 50;
export const ACCT_LEDGER_MAX_PER_PAGE = 200;
