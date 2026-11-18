import type {
  MakerCheckerCreateDto,
  MakerCheckerCreateInput,
  MakerCheckerDto,
  MakerCheckerRule,
  MakerCheckerUpdateDto,
  MakerCheckerUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/maker-checker/types/maker-checker.types";

export function mapMakerCheckerDto(dto: MakerCheckerDto): MakerCheckerRule {
  return {
    id: dto.id,
    voucherType: dto.voucher_type,
    thresholdLimit: dto.threshold_limit,
    checkerRoleId: dto.checker_role_id,
    dualAuthReq: dto.dual_auth_req,
    autoApprv: dto.auto_apprv,
    isActive: dto.is_active,
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at,
  };
}

export function mapMakerCheckerCreateToDto(
  input: MakerCheckerCreateInput,
): MakerCheckerCreateDto {
  const dto: MakerCheckerCreateDto = {
    voucher_type: input.voucherType,
    threshold_limit: input.thresholdLimit,
    checker_role_id: input.checkerRoleId.trim(),
  };
  if (input.dualAuthReq !== undefined) dto.dual_auth_req = input.dualAuthReq;
  if (input.autoApprv !== undefined) dto.auto_apprv = input.autoApprv;
  if (input.isActive !== undefined) dto.is_active = input.isActive;
  return dto;
}

export function mapMakerCheckerUpdateToDto(
  input: MakerCheckerUpdateInput,
): MakerCheckerUpdateDto {
  return {
    id: input.id,
    ...mapMakerCheckerCreateToDto(input),
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
