import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapRoleMenuAssignToDto,
  mapRoleMenuPayloadDto,
} from "@/features/master/role-menu/mappers/role-menu.mapper";
import {
  roleMenuAssignInputSchema,
  roleMenuPayloadDtoSchema,
} from "@/features/master/role-menu/schemas/role-menu.schema";
import type {
  RoleMenuGetQuery,
  RoleMenuMatrix,
} from "@/features/master/role-menu/types/role-menu.types";
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

function parsePayload(data: unknown): RoleMenuMatrix {
  const parsed = roleMenuPayloadDtoSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Role menu response shape was unexpected",
      status: 500,
      code: "UNEXPECTED",
      details: parsed.error.flatten(),
    });
  }
  return mapRoleMenuPayloadDto(parsed.data);
}

/** Laravel: GET /api/RoleMenuGet */
export async function getRoleMenu(
  query: RoleMenuGetQuery,
): Promise<RoleMenuMatrix> {
  if (!Number.isFinite(query.roleId) || query.roleId < 1) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: { roleId: ["Role is required"] },
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<unknown>>(
      endpoints.roleMenu.get,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          role_id: query.roleId,
          status: query.status,
          assigned_only:
            query.assignedOnly === undefined
              ? undefined
              : query.assignedOnly
                ? 1
                : 0,
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
          : "Failed to load role menu permissions";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    return parsePayload(payload.data);
  });
}

/** Laravel: POST /api/RoleMenuAssign (full replace). */
export async function assignRoleMenu(input: unknown): Promise<RoleMenuMatrix> {
  const validated = roleMenuAssignInputSchema.safeParse(input);
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
    const body = mapRoleMenuAssignToDto(validated.data);
    const data = await api.post<unknown>(endpoints.roleMenu.assign, body, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Role menu assign returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return parsePayload(data);
  });
}
