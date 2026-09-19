/**
 * Role types — documented RoleList / RoleAdd / RoleEdit fields only.
 */

export type RoleDto = {
  id: number;
  role_name: string;
  is_admin: boolean;
  status: number;
  created_by: number | null;
  created_at: string;
};

export type Role = {
  id: number;
  roleName: string;
  isAdmin: boolean;
  status: number;
  createdBy: number | null;
  createdAt: string;
};

export type RoleListQuery = {
  page?: number;
  perPage?: number;
  roleId?: number;
  keyword?: string;
  isAdmin?: number;
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

export type RoleListResult = {
  items: Role[];
  meta: PaginationMeta | null;
};

export type RoleCreateInput = {
  roleName: string;
  isAdmin?: boolean;
  status?: number;
};

export type RoleCreateDto = {
  role_name: string;
  is_admin?: boolean;
  status?: number;
};

export type RoleUpdateInput = {
  roleId: number;
  roleName: string;
  isAdmin?: boolean;
  status?: number;
};

export type RoleUpdateDto = {
  role_id: number;
  role_name: string;
  is_admin?: boolean;
  status?: number;
};

export type RoleMutationResult = {
  id: number;
};
