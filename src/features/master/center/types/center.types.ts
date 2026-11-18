/**
 * Center / Kendra — Laravel CenterList / CenterAdd / CenterEdit.
 */

export type CenterDto = {
  center_id: number;
  branch_id: number;
  branch_code?: string | null;
  branch_name?: string | null;
  center_name: string;
  center_address?: string | null;
  is_active: boolean;
};

export type Center = {
  centerId: number;
  branchId: number;
  branchCode: string | null;
  branchName: string | null;
  centerName: string;
  centerAddress: string | null;
  isActive: boolean;
};

export type CenterListQuery = {
  page?: number;
  perPage?: number;
  centerId?: number;
  branchId?: number;
  search?: string;
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

export type CenterListResult = {
  items: Center[];
  meta: PaginationMeta | null;
};

export type CenterCreateInput = {
  branchId: number;
  centerName: string;
  centerAddress?: string | null;
  isActive?: boolean;
};

export type CenterCreateDto = {
  branch_id: number;
  center_name: string;
  center_address?: string | null;
  is_active?: boolean;
};

export type CenterUpdateInput = CenterCreateInput & {
  centerId: number;
};

export type CenterUpdateDto = CenterCreateDto & {
  center_id: number;
};

export const CENTER_DEFAULT_PER_PAGE = 50;
export const CENTER_MAX_PER_PAGE = 200;
