import type {
  PaginationMeta,
  PaginationMetaDto,
  Role,
  RoleCreateDto,
  RoleCreateInput,
  RoleDto,
  RoleUpdateDto,
  RoleUpdateInput,
} from "@/features/master/roles/types/role.types";

export function mapRoleDto(dto: RoleDto): Role {
  return {
    id: dto.id,
    roleName: dto.role_name,
    description: dto.description ?? "",
    isAdmin: dto.is_admin,
    status: dto.status,
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at,
  };
}

export function mapRoleCreateToDto(input: RoleCreateInput): RoleCreateDto {
  const dto: RoleCreateDto = {
    role_name: input.roleName,
  };
  if (input.description !== undefined) {
    const trimmed = input.description.trim();
    if (trimmed.length > 0) dto.description = trimmed;
  }
  if (input.isAdmin !== undefined) dto.is_admin = input.isAdmin;
  if (input.status !== undefined) dto.status = input.status;
  return dto;
}

export function mapRoleUpdateToDto(input: RoleUpdateInput): RoleUpdateDto {
  const dto: RoleUpdateDto = {
    role_id: input.roleId,
    role_name: input.roleName,
  };
  // Always send description on edit so empty/null can clear per API contract.
  if (input.description !== undefined) {
    dto.description =
      input.description == null ? null : input.description.trim();
  }
  if (input.isAdmin !== undefined) dto.is_admin = input.isAdmin;
  if (input.status !== undefined) dto.status = input.status;
  return dto;
}

export function mapPaginationMetaDto(dto: PaginationMetaDto): PaginationMeta {
  return {
    total: dto.total,
    page: dto.page,
    perPage: dto.per_page,
    lastPage: dto.last_page,
    hasMore: dto.has_more,
  };
}
