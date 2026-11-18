import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapOrganizationDto,
  mapOrganizationUpdateToDto,
  mapPaginationMetaDto,
  mapStateDto,
} from "@/features/master/organization/mappers/organization.mapper";
import {
  organizationDtoSchema,
  organizationUpdateInputSchema,
  paginationMetaDtoSchema,
  stateDtoSchema,
} from "@/features/master/organization/schemas/organization.schema";
import type {
  Organization,
  OrganizationDto,
  StateDto,
  StateListQuery,
  StateListResult,
} from "@/features/master/organization/types/organization.types";
import type { LaravelResponse } from "@/types/api";

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

export async function getOrganization(): Promise<Organization> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.get<OrganizationDto>(endpoints.org.get, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Organization not found",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const parsed = organizationDtoSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Organization response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }

    return mapOrganizationDto(parsed.data);
  });
}

export async function updateOrganization(
  input: unknown,
): Promise<Organization> {
  const validated = organizationUpdateInputSchema.safeParse(input);
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
    const body = mapOrganizationUpdateToDto(validated.data);
    const data = await api.post<OrganizationDto>(endpoints.org.update, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Organization update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const parsed = organizationDtoSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Organization response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }

    return mapOrganizationDto(parsed.data);
  });
}

export async function listStates(
  query: StateListQuery = {},
): Promise<StateListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<StateDto[]>>(
      endpoints.stateList,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.perPage ?? 50,
          state_cd: query.stateCd,
          keyword: query.keyword,
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
          : "Failed to load states";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = stateDtoSchema.safeParse(row);
      return parsed.success ? [mapStateDto(parsed.data)] : [];
    });

    let meta: ReturnType<typeof mapPaginationMetaDto> | null = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}
