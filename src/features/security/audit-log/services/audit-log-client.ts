/**
 * Browser-safe AuditLog helpers — BFF only, never Laravel token.
 * Browser → GET /api/security/audit-log → Laravel GET /api/AuditLogList
 */

import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  AuditLogListQuery,
  AuditLogListResult,
} from "@/features/security/audit-log/types/audit-log.types";

export type AuditLogClientError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

async function parseEnvelope<T>(response: Response): Promise<T> {
  let payload: Envelope<T> = {};
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    const error: AuditLogClientError = {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
      details: payload.errors ?? null,
      code:
        response.status === 401
          ? "UNAUTHORIZED"
          : response.status === 422
            ? "VALIDATION"
            : response.status === 404
              ? "NOT_FOUND"
              : "UNEXPECTED",
    };
    throw error;
  }

  return payload.data as T;
}

export function isAuditLogClientError(
  value: unknown,
): value is AuditLogClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as AuditLogClientError).message === "string"
  );
}

function listQueryKey(query: AuditLogListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.auditId != null) params.set("audit_id", String(query.auditId));
  if (query.userId != null) params.set("user_id", String(query.userId));
  if (query.menuName) params.set("menu_name", query.menuName);
  if (query.tableName) params.set("table_name", query.tableName);
  if (query.recordId != null) params.set("record_id", String(query.recordId));
  if (query.action != null) params.set("action", String(query.action));
  if (query.search) params.set("search", query.search);
  if (query.fromDate) params.set("from_date", query.fromDate);
  if (query.toDate) params.set("to_date", query.toDate);
  return params.toString() || "default";
}

export async function fetchAuditLogList(
  query: AuditLogListQuery = {},
): Promise<AuditLogListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `security:audit-log:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.auditLog}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<AuditLogListResult>(response);
    },
    0,
  );
}
