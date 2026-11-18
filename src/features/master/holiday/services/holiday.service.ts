import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapHolidayDto,
  mapHolidaySaveToDto,
  mapPaginationMetaDto,
} from "@/features/master/holiday/mappers/holiday.mapper";
import {
  holidayDtoSchema,
  holidaySaveInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/holiday/schemas/holiday.schema";
import type {
  Holiday,
  HolidayDto,
  HolidayListQuery,
  HolidayListResult,
} from "@/features/master/holiday/types/holiday.types";
import {
  HOLIDAY_DEFAULT_PER_PAGE,
  HOLIDAY_MAX_PER_PAGE,
} from "@/features/master/holiday/types/holiday.types";
import type { LaravelResponse } from "@/types/api";

function clampPerPage(value: number | undefined): number {
  const raw = value ?? HOLIDAY_DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return HOLIDAY_DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), HOLIDAY_MAX_PER_PAGE);
}

async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({
      message: "Unauthorized. Bearer token required.",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }
  return token;
}

async function withUnauthorizedClear<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await clearAuthSession();
    }
    throw error;
  }
}

function parseHolidayRow(row: unknown): Holiday | null {
  const parsed = holidayDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapHolidayDto(parsed.data);
}

/** Laravel: GET /api/HolidayGet */
export async function listHolidays(
  query: HolidayListQuery = {},
): Promise<HolidayListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<HolidayDto[]>>(
      endpoints.holiday.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          id: query.id,
          year_sl: query.yearSl,
          holi_type: query.holiType,
          search: query.search,
          from_date: query.fromDate,
          to_date: query.toDate,
        },
      },
    );

    if (
      !payload ||
      typeof payload !== "object" ||
      !("success" in payload) ||
      payload.success !== true
    ) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Failed to load holidays";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const holiday = parseHolidayRow(row);
      return holiday ? [holiday] : [];
    });

    let meta: HolidayListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/HolidayUpdate (upsert). */
export async function saveHoliday(input: unknown): Promise<Holiday> {
  const validated = holidaySaveInputSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const body = mapHolidaySaveToDto(validated.data);
    const data = await api.post<HolidayDto>(endpoints.holiday.update, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Holiday save returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const holiday = parseHolidayRow(data);
    if (!holiday) {
      throw new ApiError({
        message: "Holiday response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return holiday;
  });
}
