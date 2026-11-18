import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapCenterCreateToDto,
  mapCenterDto,
  mapCenterUpdateToDto,
  mapPaginationMetaDto,
} from "@/features/master/center/mappers/center.mapper";
import {
  centerCreateInputSchema,
  centerDtoSchema,
  centerUpdateInputSchema,
  paginationMetaDtoSchema,
} from "@/features/master/center/schemas/center.schema";
import type {
  Center,
  CenterDto,
  CenterListQuery,
  CenterListResult,
} from "@/features/master/center/types/center.types";
import {
  CENTER_DEFAULT_PER_PAGE,
  CENTER_MAX_PER_PAGE,
} from "@/features/master/center/types/center.types";
import type { LaravelResponse } from "@/types/api";

function clampPerPage(value: number | undefined): number {
  const raw = value ?? CENTER_DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return CENTER_DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), CENTER_MAX_PER_PAGE);
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

function parseCenterRow(row: unknown): Center | null {
  const parsed = centerDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapCenterDto(parsed.data);
}

/** Laravel: GET /api/CenterList */
export async function listCenters(
  query: CenterListQuery = {},
): Promise<CenterListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<CenterDto[]>>(
      endpoints.center.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          center_id: query.centerId,
          branch_id: query.branchId,
          search: query.search,
          is_active: query.isActive,
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
          : "Failed to load centers";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const center = parseCenterRow(row);
      return center ? [center] : [];
    });

    let meta: CenterListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

/** Laravel: POST /api/CenterAdd */
export async function createCenter(input: unknown): Promise<Center> {
  const validated = centerCreateInputSchema.safeParse(input);
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
    const body = mapCenterCreateToDto(validated.data);
    const data = await api.post<CenterDto>(endpoints.center.add, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Center create returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const center = parseCenterRow(data);
    if (!center) {
      throw new ApiError({
        message: "Center create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return center;
  });
}

/** Laravel: POST /api/CenterEdit */
export async function updateCenter(input: unknown): Promise<Center> {
  const validated = centerUpdateInputSchema.safeParse(input);
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
    const body = mapCenterUpdateToDto(validated.data);
    const data = await api.post<CenterDto>(endpoints.center.edit, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Center update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const center = parseCenterRow(data);
    if (!center) {
      throw new ApiError({
        message: "Center update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return center;
  });
}
