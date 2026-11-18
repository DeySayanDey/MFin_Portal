/**
 * Browser-safe Organization helpers.
 * Calls Next.js BFF only — never Laravel and never the Bearer token.
 */

import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  Organization,
  OrganizationUpdateInput,
  StateListQuery,
  StateListResult,
} from "@/features/master/organization/types/organization.types";

export type OrganizationClientError = {
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
    const error: OrganizationClientError = {
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

export function isOrganizationClientError(
  value: unknown,
): value is OrganizationClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as OrganizationClientError).message === "string"
  );
}

export async function fetchOrganization(): Promise<Organization> {
  return dedupeRequest("master:organization", async () => {
    const response = await fetch("/api/master/organization", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    return parseEnvelope<Organization>(response);
  });
}

export async function saveOrganization(
  input: OrganizationUpdateInput,
): Promise<Organization> {
  const response = await fetch("/api/master/organization", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<Organization>(response);
  clearDedupe("master:organization");
  return data;
}

export async function fetchStates(
  query: StateListQuery = {},
): Promise<StateListResult> {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.stateCd != null) params.set("state_cd", String(query.stateCd));
  if (query.keyword) params.set("keyword", query.keyword);

  const qs = params.toString();
  const key = `master:states:${qs || "default"}`;

  return dedupeRequest(key, async () => {
    const response = await fetch(
      `/api/master/states${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      },
    );
    return parseEnvelope<StateListResult>(response);
  });
}
