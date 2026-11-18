import type {
  AcctCategory,
  AcctCategoryCreateDto,
  AcctCategoryCreateInput,
  AcctCategoryDto,
  AcctCategoryUpdateDto,
  AcctCategoryUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/acct-category/types/acct-category.types";

export function mapAcctCategoryDto(dto: AcctCategoryDto): AcctCategory {
  return {
    categId: dto.categ_id,
    categCode: dto.categ_code,
    categName: dto.categ_name,
    categoryType: dto.categy_type?.trim() ? dto.categy_type.trim() : null,
    headCount: dto.head_count ?? 0,
  };
}

function mapWritable(
  input: AcctCategoryCreateInput,
): Omit<AcctCategoryCreateDto, never> {
  const dto: AcctCategoryCreateDto = {
    categ_name: input.categName.trim(),
    categy_type: input.categoryType.trim().toUpperCase(),
  };
  if (input.categCode !== undefined) {
    dto.categ_code =
      input.categCode == null || input.categCode.trim() === ""
        ? null
        : input.categCode.trim();
  }
  return dto;
}

export function mapAcctCategoryCreateToDto(
  input: AcctCategoryCreateInput,
): AcctCategoryCreateDto {
  return mapWritable(input);
}

export function mapAcctCategoryUpdateToDto(
  input: AcctCategoryUpdateInput,
): AcctCategoryUpdateDto {
  return {
    ...mapWritable(input),
    categ_id: input.categId,
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
