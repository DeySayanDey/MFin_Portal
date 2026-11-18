/**
 * Operational Days — Laravel OperationalDaysList / Add / Edit.
 */

export const DAY_OF_WEEK_MIN = 1;
export const DAY_OF_WEEK_MAX = 7;

export type OperationalDayDto = {
  rec_id: number;
  branch_id: number;
  branch_code?: string | null;
  branch_name?: string | null;
  day_of_week: number;
  day_name?: string | null;
  is_operational: boolean;
  is_half_day: boolean;
  open_time?: string | null;
  close_time?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string | null;
};

export type OperationalDay = {
  recId: number;
  branchId: number;
  branchCode: string | null;
  branchName: string | null;
  dayOfWeek: number;
  dayName: string | null;
  isOperational: boolean;
  isHalfDay: boolean;
  openTime: string | null;
  closeTime: string | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string | null;
};

export type OperationalDayListQuery = {
  page?: number;
  perPage?: number;
  recId?: number;
  branchId?: number;
  dayOfWeek?: number;
  isOperational?: number;
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

export type OperationalDayListResult = {
  items: OperationalDay[];
  meta: PaginationMeta | null;
};

export type OperationalDayCreateInput = {
  branchId: number;
  dayOfWeek: number;
  isOperational?: boolean;
  isHalfDay?: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  isActive?: boolean;
};

export type OperationalDayCreateDto = {
  branch_id: number;
  day_of_week: number;
  is_operational?: boolean;
  is_half_day?: boolean;
  open_time?: string | null;
  close_time?: string | null;
  is_active?: boolean;
};

export type OperationalDayUpdateInput = OperationalDayCreateInput & {
  recId: number;
};

export type OperationalDaysBulkInput = Omit<OperationalDayCreateInput, "dayOfWeek"> & {
  days: { dayOfWeek: number; recId?: number | null }[];
};

export type OperationalDaysBulkResult = {
  branchId: number;
  created: number;
  updated: number;
  days: OperationalDay[];
};

export type OperationalDayUpdateDto = OperationalDayCreateDto & {
  rec_id: number;
};

export const OPERATIONAL_DAYS_DEFAULT_PER_PAGE = 50;
export const OPERATIONAL_DAYS_MAX_PER_PAGE = 200;
