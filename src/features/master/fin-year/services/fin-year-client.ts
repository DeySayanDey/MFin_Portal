/**
 * Browser-safe FinYear helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  FinYear,
  FinYearListQuery,
  FinYearListResult,
  FinYearSaveInput,
} from "@/features/master/fin-year/types/fin-year.types";

export type FinYearClientError = {
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
    const error: FinYearClientError = {
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

export function isFinYearClientError(
  value: unknown,
): value is FinYearClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as FinYearClientError).message === "string"
  );
}

function listQueryKey(query: FinYearListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.yearId != null) params.set("year_id", String(query.yearId));
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  if (query.search) params.set("search", query.search);
  return params.toString() || "default";
}

export async function fetchFinYearList(
  query: FinYearListQuery = {},
): Promise<FinYearListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:fin-year:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.finYear}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<FinYearListResult>(response);
    },
    0,
  );
}

export async function saveFinYear(input: FinYearSaveInput): Promise<FinYear> {
  const response = await fetch(endpoints.bff.finYear, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<FinYear>(response);
  clearDedupe();
  return data;
}
