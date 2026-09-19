import type {
  CodeSeries,
  CodeSeriesUpdateDto,
  CodeSeriesUpdateInput,
  PaginationMeta,
  PaginationMetaDto,
} from "@/features/master/code-series/types/code-series.types";

export function mapCodeSeriesDto(dto: {
  series_id: number;
  module_key: string;
  module_name: string;
  prefix: string;
  next_counter: number;
  padding_digits: number;
  suffix: string;
  formatted_sample: string;
  status: number;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
}): CodeSeries {
  return {
    seriesId: dto.series_id,
    moduleKey: dto.module_key,
    moduleName: dto.module_name,
    prefix: dto.prefix,
    nextCounter: dto.next_counter,
    paddingDigits: dto.padding_digits,
    suffix: dto.suffix,
    formattedSample: dto.formatted_sample,
    status: dto.status,
    updatedBy: dto.updated_by ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function mapCodeSeriesUpdateToDto(
  input: CodeSeriesUpdateInput,
): CodeSeriesUpdateDto {
  const dto: CodeSeriesUpdateDto = {
    series_id: input.seriesId,
    next_counter: input.nextCounter,
    padding_digits: input.paddingDigits,
  };

  if (input.prefix !== undefined) dto.prefix = input.prefix;
  if (input.suffix !== undefined) dto.suffix = input.suffix;
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
