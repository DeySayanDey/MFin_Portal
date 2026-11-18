import type {
  Holiday,
  HolidaySaveDto,
  HolidaySaveInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/holiday/types/holiday.types";

export function mapHolidayDto(dto: {
  id: number;
  year_sl: number;
  year_name?: string | null;
  holiday_date: string;
  purpose: string;
  holi_type: number;
}): Holiday {
  return {
    id: dto.id,
    yearSl: dto.year_sl,
    yearName: dto.year_name ?? null,
    holidayDate: dto.holiday_date,
    purpose: dto.purpose,
    holiType: dto.holi_type,
  };
}

export function mapHolidaySaveToDto(input: HolidaySaveInput): HolidaySaveDto {
  const dto: HolidaySaveDto = {
    year_sl: input.yearSl,
    holiday_date: input.holidayDate.trim(),
    purpose: input.purpose.trim(),
  };
  if (input.id != null) {
    dto.id = input.id;
  }
  if (input.holiType != null) {
    dto.holi_type = input.holiType;
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
