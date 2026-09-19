import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapDesignationDto,
  mapModuleAccessDto,
  mapPaginationMetaDto,
  mapStaffCreateToDto,
  mapStaffDto,
  mapStaffMutationResult,
  mapStaffUpdateToDto,
} from "@/features/master/staff/mappers/staff.mapper";
import {
  designationDtoSchema,
  moduleAccessDtoSchema,
  paginationMetaDtoSchema,
  staffCreateInputSchema,
  staffDtoSchema,
  staffMutationResultSchema,
  staffUpdateInputSchema,
} from "@/features/master/staff/schemas/staff.schema";
import type {
  StaffDto,
  StaffListQuery,
  StaffListResult,
  StaffLookups,
  StaffMutationResult,
} from "@/features/master/staff/types/staff.types";
import type { LaravelResponse } from "@/types/api";

/** Documented aliases: `keyword` / `search`. */
export const STAFF_SEARCH_PARAM = "keyword" as const;

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

export async function listStaff(
  query: StaffListQuery = {},
): Promise<StaffListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<StaffDto[]>>(
      endpoints.staff.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.perPage ?? 20,
          staff_id: query.staffId,
          branch_id: query.branchId,
          designation_id: query.designationId,
          [STAFF_SEARCH_PARAM]: query.keyword,
          status: query.status,
          include_modules: query.includeModules ? 1 : undefined,
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
          : "Failed to load staff";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = staffDtoSchema.safeParse(row);
      return parsed.success ? [mapStaffDto(parsed.data)] : [];
    });

    let meta: StaffListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

export async function createStaff(
  input: unknown,
): Promise<StaffMutationResult> {
  const validated = staffCreateInputSchema.safeParse(input);
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
    const body = mapStaffCreateToDto(validated.data);
    const data = await api.post<{
      staff_id: number;
      employee_code?: string | null;
    }>(endpoints.staff.add, body, {
      accessToken: token,
      expectEnvelope: true,
    });
    const parsed = staffMutationResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Staff create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }
    return mapStaffMutationResult(parsed.data);
  });
}

export async function updateStaff(
  input: unknown,
): Promise<StaffMutationResult> {
  const validated = staffUpdateInputSchema.safeParse(input);
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
    const body = mapStaffUpdateToDto(validated.data);
    const data = await api.post<{
      staff_id: number;
      employee_code?: string | null;
    }>(endpoints.staff.edit, body, {
      accessToken: token,
      expectEnvelope: true,
    });
    const parsed = staffMutationResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Staff update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }
    return mapStaffMutationResult(parsed.data);
  });
}

export async function getStaffLookups(): Promise<StaffLookups> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();

    const [designationPayload, modulePayload] = await Promise.all([
      api.get<LaravelResponse<unknown[]>>(endpoints.staff.designationList, {
        accessToken: token,
        expectEnvelope: false,
      }),
      api.get<LaravelResponse<unknown[]>>(endpoints.staff.moduleAccessList, {
        accessToken: token,
        expectEnvelope: false,
      }),
    ]);

    const designations = Array.isArray(designationPayload?.data)
      ? designationPayload.data.flatMap((row) => {
          const parsed = designationDtoSchema.safeParse(row);
          return parsed.success ? [mapDesignationDto(parsed.data)] : [];
        })
      : [];

    const modules = Array.isArray(modulePayload?.data)
      ? modulePayload.data.flatMap((row) => {
          const parsed = moduleAccessDtoSchema.safeParse(row);
          return parsed.success ? [mapModuleAccessDto(parsed.data)] : [];
        })
      : [];

    return { designations, modules };
  });
}
