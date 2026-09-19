/**
 * Branch types — documented BranchList / BranchAdd / BranchEdit only.
 */

export type BranchDto = {
  branch_id: number;
  org_id: number;
  branch_code: string;
  branch_name: string;
  branch_address: string | null;
  branch_mobile: string | null;
  branch_mail: string | null;
  header_text: string | null;
  is_head: boolean;
  is_active: boolean;
};

export type Branch = {
  branchId: number;
  orgId: number;
  branchCode: string;
  branchName: string;
  branchAddress: string | null;
  branchMobile: string | null;
  branchMail: string | null;
  headerText: string | null;
  isHead: boolean;
  isActive: boolean;
};

export type BranchListQuery = {
  page?: number;
  perPage?: number;
  branchId?: number;
  keyword?: string;
  isHead?: number;
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

export type BranchListResult = {
  items: Branch[];
  meta: PaginationMeta | null;
};

export type BranchCreateInput = {
  /** Optional — omit on create so backend/code-series can generate it. */
  branchCode?: string | null;
  branchName: string;
  branchAddress?: string | null;
  branchMobile?: string | null;
  branchMail?: string | null;
  headerText?: string | null;
  isHead?: boolean;
  isActive?: boolean;
};

export type BranchCreateDto = {
  branch_code?: string | null;
  branch_name: string;
  branch_address?: string | null;
  branch_mobile?: string | null;
  branch_mail?: string | null;
  header_text?: string | null;
  is_head?: boolean;
  is_active?: boolean;
};

export type BranchUpdateInput = BranchCreateInput & {
  branchId: number;
  /** Required on edit — send existing code from loaded row. */
  branchCode: string;
};

export type BranchUpdateDto = BranchCreateDto & {
  branch_id: number;
  branch_code: string;
};

export type BranchMutationResult = {
  branchId: number;
};
