/**
 * Audit log types — live-verified AuditLogList (GET only).
 */

export type AuditLogDto = {
  audit_id: number;
  user_id: number | null;
  menu_name: string | null;
  table_name: string | null;
  record_id: number | null;
  action: number;
  action_name: string;
  old_values: unknown;
  new_values: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AuditLog = {
  auditId: number;
  userId: number | null;
  menuName: string | null;
  tableName: string | null;
  recordId: number | null;
  action: number;
  actionName: string;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AuditLogListQuery = {
  page?: number;
  perPage?: number;
  auditId?: number;
  userId?: number;
  /** Documented live alias: `search` (preferred over `keyword`). */
  search?: string;
  action?: number;
  menuName?: string;
  tableName?: string;
  dateFrom?: string;
  dateTo?: string;
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

export type AuditLogListResult = {
  items: AuditLog[];
  meta: PaginationMeta | null;
};

/** Known action codes observed from AuditLogList. */
export const AUDIT_ACTIONS = {
  create: 1,
  update: 2,
  login: 4,
  logout: 5,
} as const;
