import type {
  Center,
  CenterCreateDto,
  CenterCreateInput,
  CenterUpdateDto,
  CenterUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/center/types/center.types";

export function mapCenterDto(dto: {
  center_id: number;
  branch_id: number;
  branch_code?: string | null;
  branch_name?: string | null;
  center_name: string;
  center_address?: string | null;
  is_active: boolean;
}): Center {
  return {
    centerId: dto.center_id,
    branchId: dto.branch_id,
    branchCode: dto.branch_code ?? null,
    branchName: dto.branch_name ?? null,
    centerName: dto.center_name,
    centerAddress: dto.center_address ?? null,
    isActive: dto.is_active === true,
  };
}

function mapWritable(input: CenterCreateInput): CenterCreateDto {
  const dto: CenterCreateDto = {
    branch_id: input.branchId,
    center_name: input.centerName.trim(),
  };
  if (input.centerAddress !== undefined) {
    const trimmed =
      input.centerAddress == null ? null : input.centerAddress.trim();
    dto.center_address = trimmed === "" ? null : trimmed;
  }
  if (input.isActive !== undefined) {
    dto.is_active = input.isActive === true;
  }
  return dto;
}

export function mapCenterCreateToDto(input: CenterCreateInput): CenterCreateDto {
  return mapWritable(input);
}

export function mapCenterUpdateToDto(input: CenterUpdateInput): CenterUpdateDto {
  return {
    ...mapWritable(input),
    center_id: input.centerId,
  };
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
