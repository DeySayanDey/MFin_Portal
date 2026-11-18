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
  roleUpdateInputSchema,
} from "@/features/master/roles/schemas/role.schema";
import type {
  Role,
  RoleDto,
  RoleListQuery,
  RoleListResult,
} from "@/features/master/roles/types/role.types";
import type { LaravelResponse } from "@/types/api";

/**
 * Documented search aliases: `keyword` / `role_name` / `search`.
 * BFF always sends `keyword`.
 */
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

function parseRoleRow(row: unknown): Role | null {
  const parsed = roleDtoSchema.safeParse(row);
  if (!parsed.success) return null;
  return mapRoleDto({
    ...parsed.data,
    description: parsed.data.description ?? null,
    created_by: parsed.data.created_by ?? null,
  });
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
          per_page: query.perPage ?? 50,
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
      const role = parseRoleRow(row);
      return role ? [role] : [];
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

export async function createRole(input: unknown): Promise<Role> {
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
    const data = await api.post<RoleDto>(endpoints.role.add, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    const role = parseRoleRow(data);
    if (!role) {
      throw new ApiError({
        message: "Role create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: data,
      });
    }
    return role;
  });
}

export async function updateRole(input: unknown): Promise<Role> {
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
    const data = await api.post<RoleDto>(endpoints.role.edit, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    const role = parseRoleRow(data);
    if (!role) {
      throw new ApiError({
        message: "Role update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: data,
      });
    }
    return role;
  });
}

/** Convenience: reload one role after mutate if list row needed. */
export async function getRoleById(roleId: number): Promise<Role | null> {
  const result = await listRoles({ roleId, page: 1, perPage: 1 });
  return result.items[0] ?? null;
}
