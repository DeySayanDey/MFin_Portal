/**
 * Browser-safe Role Menu helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  RoleMenuAssignInput,
  RoleMenuGetQuery,
  RoleMenuMatrix,
} from "@/features/master/role-menu/types/role-menu.types";

export type RoleMenuClientError = {
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
    const error: RoleMenuClientError = {
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

export function isRoleMenuClientError(
  value: unknown,
): value is RoleMenuClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as RoleMenuClientError).message === "string"
  );
}

function getQueryKey(query: RoleMenuGetQuery): string {
  const params = new URLSearchParams();
  params.set("role_id", String(query.roleId));
  if (query.status != null) params.set("status", String(query.status));
  if (query.assignedOnly != null) {
    params.set("assigned_only", query.assignedOnly ? "1" : "0");
  }
  return params.toString();
}

export async function fetchRoleMenu(
  query: RoleMenuGetQuery,
): Promise<RoleMenuMatrix> {
  const qs = getQueryKey(query);
  return dedupeRequest(
    `master:role-menu:${qs}`,
    async () => {
      const response = await fetch(`${endpoints.bff.roleMenu}?${qs}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store",
      });
      return parseEnvelope<RoleMenuMatrix>(response);
    },
    0,
  );
}

export async function saveRoleMenu(
  input: RoleMenuAssignInput,
): Promise<RoleMenuMatrix> {
  const response = await fetch(endpoints.bff.roleMenu, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<RoleMenuMatrix>(response);
  clearDedupe();
  return data;
}
