import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapAuditLogDto,
  mapPaginationMetaDto,
} from "@/features/security/audit-log/mappers/audit-log.mapper";
import {
  auditLogDtoSchema,
  paginationMetaDtoSchema,
} from "@/features/security/audit-log/schemas/audit-log.schema";
import type {
  AuditLogDto,
  AuditLogListQuery,
  AuditLogListResult,
} from "@/features/security/audit-log/types/audit-log.types";
import {
  AUDIT_LOG_DEFAULT_PER_PAGE,
  AUDIT_LOG_MAX_PER_PAGE,
} from "@/features/security/audit-log/types/audit-log.types";
import type { LaravelResponse } from "@/types/api";

function clampPerPage(value: number | undefined): number {
  const raw = value ?? AUDIT_LOG_DEFAULT_PER_PAGE;
  if (!Number.isFinite(raw) || raw < 1) return AUDIT_LOG_DEFAULT_PER_PAGE;
  return Math.min(Math.floor(raw), AUDIT_LOG_MAX_PER_PAGE);
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

/**
 * Laravel: GET /api/AuditLogList
 * Query: page, per_page, audit_id, user_id, menu_name, table_name,
 *        record_id, action, keyword|search, from_date, to_date
 */
export async function listAuditLogs(
  query: AuditLogListQuery = {},
): Promise<AuditLogListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<AuditLogDto[]>>(
      endpoints.auditLog.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: clampPerPage(query.perPage),
          audit_id: query.auditId,
          user_id: query.userId,
          menu_name: query.menuName,
          table_name: query.tableName,
          record_id: query.recordId,
          action: query.action,
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
          : "Failed to load audit logs";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = auditLogDtoSchema.safeParse(row);
      return parsed.success ? [mapAuditLogDto(parsed.data)] : [];
    });

    let meta: AuditLogListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}
