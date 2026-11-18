import type {
  FinYear,
  FinYearSaveDto,
  FinYearSaveInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/fin-year/types/fin-year.types";

export function mapFinYearDto(dto: {
  year_id: number;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}): FinYear {
  return {
    yearId: dto.year_id,
    yearName: dto.year_name,
    startDate: dto.start_date,
    endDate: dto.end_date,
    isActive: dto.is_active === true,
  };
}

export function mapFinYearSaveToDto(input: FinYearSaveInput): FinYearSaveDto {
  const dto: FinYearSaveDto = {
    year_name: input.yearName.trim(),
    start_date: input.startDate.trim(),
    end_date: input.endDate.trim(),
  };
  if (input.yearId != null) {
    dto.year_id = input.yearId;
  }
  if (input.isActive !== undefined) {
    dto.is_active = input.isActive === true;
  }
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
