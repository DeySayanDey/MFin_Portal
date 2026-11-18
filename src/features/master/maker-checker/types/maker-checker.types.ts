/**
 * Maker-checker rule types — MakerCheckerList / Add / Edit fields only.
 */

export type MakerCheckerDto = {
  id: number;
  voucher_type: number;
  threshold_limit: number;
  checker_role_id: string;
  dual_auth_req: boolean;
  auto_apprv: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
};

export type MakerCheckerRule = {
  id: number;
  voucherType: number;
  thresholdLimit: number;
  checkerRoleId: string;
  dualAuthReq: boolean;
  autoApprv: boolean;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
};

export type MakerCheckerListQuery = {
  page?: number;
  perPage?: number;
  id?: number;
  voucherType?: number;
  /** `0` / `1` — sent as `is_active` (also accepts `status`). */
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

export type MakerCheckerListResult = {
  items: MakerCheckerRule[];
  meta: PaginationMeta | null;
};

export type MakerCheckerCreateInput = {
  voucherType: number;
  thresholdLimit: number;
  checkerRoleId: string;
  dualAuthReq?: boolean;
  autoApprv?: boolean;
  isActive?: boolean;
};

export type MakerCheckerCreateDto = {
  voucher_type: number;
  threshold_limit: number;
  checker_role_id: string;
  dual_auth_req?: boolean;
  auto_apprv?: boolean;
  is_active?: boolean;
};

export type MakerCheckerUpdateInput = {
  id: number;
  voucherType: number;
  thresholdLimit: number;
  checkerRoleId: string;
  dualAuthReq?: boolean;
  autoApprv?: boolean;
  isActive?: boolean;
};

export type MakerCheckerUpdateDto = {
  id: number;
  voucher_type: number;
  threshold_limit: number;
  checker_role_id: string;
  dual_auth_req?: boolean;
  auto_apprv?: boolean;
  is_active?: boolean;
};
