/**
 * Browser-safe Center helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  Center,
  CenterCreateInput,
  CenterListQuery,
  CenterListResult,
  CenterUpdateInput,
} from "@/features/master/center/types/center.types";

export type CenterClientError = {
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
    const error: CenterClientError = {
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

export function isCenterClientError(
  value: unknown,
): value is CenterClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as CenterClientError).message === "string"
  );
}

function listQueryKey(query: CenterListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.centerId != null) params.set("center_id", String(query.centerId));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.search) params.set("search", query.search);
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchCenterList(
  query: CenterListQuery = {},
): Promise<CenterListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:center:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.center}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<CenterListResult>(response);
    },
    0,
  );
}

export async function createCenter(
  input: CenterCreateInput,
): Promise<Center> {
  const response = await fetch(endpoints.bff.center, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<Center>(response);
  clearDedupe();
  return data;
}

export async function updateCenter(
  input: CenterUpdateInput,
): Promise<Center> {
  const response = await fetch(endpoints.bff.center, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<Center>(response);
  clearDedupe();
  return data;
}
