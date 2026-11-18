import type {
  AcctHead,
  AcctHeadCreateDto,
  AcctHeadCreateInput,
  AcctHeadDto,
  AcctHeadUpdateDto,
  AcctHeadUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/acct-head/types/acct-head.types";

export function mapAcctHeadDto(dto: AcctHeadDto): AcctHead {
  return {
    mainhdId: dto.mainhd_id,
    mainhdCode: dto.mainhd_code,
    mainhdName: dto.mainhd_name,
    categId: dto.categ_id,
    categCode: dto.categ_code ?? null,
    categName: dto.categ_name ?? null,
    categoryType: dto.categy_type?.trim() ? dto.categy_type.trim() : null,
    isActive: dto.is_active === true,
  };
}

function mapWritable(input: AcctHeadCreateInput): AcctHeadCreateDto {
  const dto: AcctHeadCreateDto = {
    mainhd_name: input.mainhdName.trim(),
    categ_id: input.categId,
  };
  if (input.mainhdCode !== undefined) {
    dto.mainhd_code =
      input.mainhdCode == null || input.mainhdCode.trim() === ""
        ? null
        : input.mainhdCode.trim();
  }
  if (input.isActive !== undefined) {
    dto.is_active = input.isActive === true;
  }
  return dto;
}

export function mapAcctHeadCreateToDto(
  input: AcctHeadCreateInput,
): AcctHeadCreateDto {
  return mapWritable(input);
}

export function mapAcctHeadUpdateToDto(
  input: AcctHeadUpdateInput,
): AcctHeadUpdateDto {
  return {
    ...mapWritable(input),
    mainhd_id: input.mainhdId,
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
