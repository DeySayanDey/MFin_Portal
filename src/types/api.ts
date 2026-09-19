/**
 * Shared Laravel API envelope and pagination types.
 * Source of truth: apilist.txt response shapes.
 */

export type PaginationMeta = {
  total: number;
  page: number;
  per_page: number;
  last_page: number;
  has_more: boolean;
};

export type LaravelSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  errors?: null;
  meta?: PaginationMeta;
};

export type LaravelErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
  data?: null;
};

export type LaravelResponse<T> = LaravelSuccessResponse<T> | LaravelErrorResponse;
