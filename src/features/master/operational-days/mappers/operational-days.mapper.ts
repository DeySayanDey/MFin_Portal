import type {
  OperationalDay,
  OperationalDayCreateDto,
  OperationalDayCreateInput,
  OperationalDayUpdateDto,
  OperationalDayUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/operational-days/types/operational-days.types";

export function mapOperationalDayDto(dto: {
  rec_id: number;
  branch_id: number;
  branch_code?: string | null;
  branch_name?: string | null;
  day_of_week: number;
  day_name?: string | null;
  is_operational: boolean;
  is_half_day: boolean;
  open_time?: string | null;
  close_time?: string | null;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string | null;
}): OperationalDay {
  return {
    recId: dto.rec_id,
    branchId: dto.branch_id,
    branchCode: dto.branch_code ?? null,
    branchName: dto.branch_name ?? null,
    dayOfWeek: dto.day_of_week,
    dayName: dto.day_name ?? null,
    isOperational: dto.is_operational === true,
    isHalfDay: dto.is_half_day === true,
    openTime: dto.open_time ?? null,
    closeTime: dto.close_time ?? null,
    isActive: dto.is_active === true,
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at ?? null,
  };
}

function mapWritable(
  input: OperationalDayCreateInput,
): OperationalDayCreateDto {
  const dto: OperationalDayCreateDto = {
    branch_id: input.branchId,
    day_of_week: input.dayOfWeek,
  };
  if (input.isOperational !== undefined) {
    dto.is_operational = input.isOperational === true;
  }
  if (input.isHalfDay !== undefined) {
    dto.is_half_day = input.isHalfDay === true;
  }
  if (input.openTime !== undefined) {
    dto.open_time =
      input.openTime == null || input.openTime.trim() === ""
        ? null
        : input.openTime.trim();
  }
  if (input.closeTime !== undefined) {
    dto.close_time =
      input.closeTime == null || input.closeTime.trim() === ""
        ? null
        : input.closeTime.trim();
  }
  if (input.isActive !== undefined) {
    dto.is_active = input.isActive === true;
  }
  return dto;
}

export function mapOperationalDayCreateToDto(
  input: OperationalDayCreateInput,
): OperationalDayCreateDto {
  return mapWritable(input);
}

export function mapOperationalDayUpdateToDto(
  input: OperationalDayUpdateInput,
): OperationalDayUpdateDto {
  return {
    ...mapWritable(input),
    rec_id: input.recId,
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
