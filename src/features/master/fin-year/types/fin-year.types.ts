/**
 * Financial Year — Laravel FinYearGet / FinYearUpdate.
 */

export type FinYearDto = {
  year_id: number;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export type FinYear = {
  yearId: number;
  yearName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

export type FinYearListQuery = {
  page?: number;
  /** Default 50, max 200 */
  perPage?: number;
  yearId?: number;
  /** 1 / 0 */
  isActive?: number;
  /** Maps to Laravel `search` / `keyword` */
  search?: string;
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

export type FinYearListResult = {
  items: FinYear[];
  meta: PaginationMeta | null;
};

/** Upsert: omit yearId to insert; set yearId to update. */
export type FinYearSaveInput = {
  yearId?: number;
  yearName: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
};

export type FinYearSaveDto = {
  year_id?: number;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
};

export const FIN_YEAR_DEFAULT_PER_PAGE = 50;
export const FIN_YEAR_MAX_PER_PAGE = 200;
