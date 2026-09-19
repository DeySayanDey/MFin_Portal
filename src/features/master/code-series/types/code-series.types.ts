/**
 * Code Series types — documented fields from apilist.txt only.
 */

/** Laravel CodeSeriesList / CodeSeriesUpdate row. */
export type CodeSeriesDto = {
  series_id: number;
  module_key: string;
  module_name: string;
  prefix: string;
  next_counter: number;
  padding_digits: number;
  suffix: string;
  formatted_sample: string;
  status: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
};

export type CodeSeries = {
  seriesId: number;
  moduleKey: string;
  moduleName: string;
  prefix: string;
  nextCounter: number;
  paddingDigits: number;
  suffix: string;
  formattedSample: string;
  status: number;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Canonical list query (domain).
 * Search maps to Laravel `keyword` (documented alias of `search`).
 * Change SEARCH_QUERY_PARAM in the server service if Laravel expects `search`.
 */
export type CodeSeriesListQuery = {
  page?: number;
  perPage?: number;
  seriesId?: number;
  moduleKey?: string;
  keyword?: string;
  status?: number;
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

export type CodeSeriesListResult = {
  items: CodeSeries[];
  meta: PaginationMeta | null;
};

export type CodeSeriesUpdateInput = {
  seriesId: number;
  nextCounter: number;
  paddingDigits: number;
  prefix?: string;
  suffix?: string;
  status?: number;
};

export type CodeSeriesUpdateDto = {
  series_id: number;
  next_counter: number;
  padding_digits: number;
  prefix?: string;
  suffix?: string;
  status?: number;
};
