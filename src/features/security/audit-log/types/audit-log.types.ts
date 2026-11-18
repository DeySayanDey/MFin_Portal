/**
 * AuditLogList — Laravel GET /api/AuditLogList
 * Action codes: 1 Create, 2 Update, 3 Delete, 4 Login, 5 Logout
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

/**
 * Query mapped to Laravel AuditLogList.
 * Dates → `from_date` / `to_date`; search → `search` (Laravel also accepts `keyword`).
 */
export type AuditLogListQuery = {
  page?: number;
  /** Default 50, max 200 */
  perPage?: number;
  auditId?: number;
  userId?: number;
  menuName?: string;
  tableName?: string;
  recordId?: number;
  /** Action code 1–5 */
  action?: number;
  /** Maps to Laravel `search` (menu / table / IP) */
  search?: string;
  /** Inclusive start — Laravel `from_date` */
  fromDate?: string;
  /** Inclusive end — Laravel `to_date` */
  toDate?: string;
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

export const AUDIT_ACTIONS = {
  create: 1,
  update: 2,
  delete: 3,
  login: 4,
  logout: 5,
} as const;

export const AUDIT_LOG_DEFAULT_PER_PAGE = 50;
export const AUDIT_LOG_MAX_PER_PAGE = 200;
