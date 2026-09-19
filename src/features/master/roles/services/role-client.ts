/**
 * Browser-safe Role helpers — BFF only, never Laravel token.
 */

import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  Role,
  RoleCreateInput,
  RoleListQuery,
  RoleListResult,
  RoleMutationResult,
  RoleUpdateInput,
} from "@/features/master/roles/types/role.types";

export type RoleClientError = {
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
    const error: RoleClientError = {
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

export function isRoleClientError(value: unknown): value is RoleClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as RoleClientError).message === "string"
  );
}

function listQueryKey(query: RoleListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.roleId != null) params.set("role_id", String(query.roleId));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isAdmin != null) params.set("is_admin", String(query.isAdmin));
  if (query.status != null) params.set("status", String(query.status));
  return params.toString() || "default";
}

export async function fetchRoleList(
  query: RoleListQuery = {},
): Promise<RoleListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:roles:${qs}`,
    async () => {
      const response = await fetch(
        `/api/master/roles${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        },
      );
      return parseEnvelope<RoleListResult>(response);
    },
    0,
  );
}

export async function createRole(
  input: RoleCreateInput,
): Promise<RoleMutationResult> {
  const response = await fetch("/api/master/roles", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<RoleMutationResult>(response);
  clearDedupe();
  return data;
}

export async function updateRole(
  input: RoleUpdateInput,
): Promise<RoleMutationResult> {
  const response = await fetch("/api/master/roles", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<RoleMutationResult>(response);
  clearDedupe();
  return data;
}

/** Optional: fetch single role after mutation for table refresh row. */
export async function fetchRole(roleId: number): Promise<Role | null> {
  const result = await fetchRoleList({ roleId, page: 1, perPage: 1 });
  return result.items[0] ?? null;
}
