import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapPaginationMetaDto,
  mapRoleCreateToDto,
  mapRoleDto,
  mapRoleUpdateToDto,
} from "@/features/master/roles/mappers/role.mapper";
import {
  paginationMetaDtoSchema,
  roleCreateInputSchema,
  roleDtoSchema,
  roleMutationResultSchema,
  roleUpdateInputSchema,
} from "@/features/master/roles/schemas/role.schema";
import type {
  Role,
  RoleDto,
  RoleListQuery,
  RoleListResult,
  RoleMutationResult,
} from "@/features/master/roles/types/role.types";
import type { LaravelResponse } from "@/types/api";

/** Documented aliases: `role_name` / `keyword`. Canonical for this BFF. */
export const ROLE_SEARCH_PARAM = "keyword" as const;

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

export async function listRoles(
  query: RoleListQuery = {},
): Promise<RoleListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<RoleDto[]>>(
      endpoints.role.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.perPage ?? 20,
          role_id: query.roleId,
          [ROLE_SEARCH_PARAM]: query.keyword,
          is_admin: query.isAdmin,
          status: query.status,
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
          : "Failed to load roles";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = roleDtoSchema.safeParse(row);
      return parsed.success ? [mapRoleDto(parsed.data)] : [];
    });

    let meta: RoleListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

export async function createRole(input: unknown): Promise<RoleMutationResult> {
  const validated = roleCreateInputSchema.safeParse(input);
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
    const body = mapRoleCreateToDto(validated.data);
    const data = await api.post<{ id: number }>(endpoints.role.add, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    const parsed = roleMutationResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Role create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  });
}

export async function updateRole(input: unknown): Promise<RoleMutationResult> {
  const validated = roleUpdateInputSchema.safeParse(input);
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
    const body = mapRoleUpdateToDto(validated.data);
    const data = await api.post<{ id: number }>(endpoints.role.edit, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    const parsed = roleMutationResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Role update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  });
}

/** Convenience: reload one role after mutate if list row needed. */
export async function getRoleById(roleId: number): Promise<Role | null> {
  const result = await listRoles({ roleId, page: 1, perPage: 1 });
  return result.items[0] ?? null;
}
