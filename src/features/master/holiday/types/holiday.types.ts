/**
 * Holiday Calendar — Laravel HolidayGet / HolidayUpdate.
 */

export const HOLIDAY_TYPE_NATIONAL = 1;
export const HOLIDAY_TYPE_FESTIVAL = 2;

export type HolidayType = typeof HOLIDAY_TYPE_NATIONAL | typeof HOLIDAY_TYPE_FESTIVAL;

export type HolidayDto = {
  id: number;
  year_sl: number;
  year_name?: string | null;
  holiday_date: string;
  purpose: string;
  holi_type: number;
};

export type Holiday = {
  id: number;
  yearSl: number;
  yearName: string | null;
  holidayDate: string;
  purpose: string;
  holiType: number;
};

export type HolidayListQuery = {
  page?: number;
  /** Default 50, max 200 */
  perPage?: number;
  id?: number;
  yearSl?: number;
  holiType?: number;
  /** Maps to Laravel `search` / `keyword` */
  search?: string;
  fromDate?: string;
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

export type HolidayListResult = {
  items: Holiday[];
  meta: PaginationMeta | null;
};

/** Upsert: omit id to insert; set id to update. */
export type HolidaySaveInput = {
  id?: number;
  yearSl: number;
  holidayDate: string;
  purpose: string;
  holiType?: number;
};

export type HolidaySaveDto = {
  id?: number;
  year_sl: number;
  holiday_date: string;
  purpose: string;
  holi_type?: number;
};

export const HOLIDAY_DEFAULT_PER_PAGE = 50;
export const HOLIDAY_MAX_PER_PAGE = 200;
