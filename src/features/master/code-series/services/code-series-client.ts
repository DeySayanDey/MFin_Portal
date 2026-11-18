/**
 * Browser-safe Code Series helpers.
 * Calls Next.js BFF only — never Laravel and never the Bearer token.
 */

import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  CodeSeries,
  CodeSeriesListQuery,
  CodeSeriesListResult,
  CodeSeriesUpdateInput,
} from "@/features/master/code-series/types/code-series.types";

export type CodeSeriesClientError = {
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
    const error: CodeSeriesClientError = {
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

export function isCodeSeriesClientError(
  value: unknown,
): value is CodeSeriesClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as CodeSeriesClientError).message === "string"
  );
}

function listQueryKey(query: CodeSeriesListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.seriesId != null) params.set("series_id", String(query.seriesId));
  if (query.moduleKey) params.set("module_key", query.moduleKey);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.status != null) params.set("status", String(query.status));
  return params.toString() || "default";
}

export async function fetchCodeSeriesList(
  query: CodeSeriesListQuery = {},
): Promise<CodeSeriesListResult> {
  const qs = listQueryKey(query);
  // ttl 0 = share in-flight only (Strict Mode), always refetch after settle
  return dedupeRequest(
    `master:code-series:${qs}`,
    async () => {
      const response = await fetch(
        `/api/master/code-series${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        },
      );
      return parseEnvelope<CodeSeriesListResult>(response);
    },
    0,
  );
}

export async function saveCodeSeries(
  input: CodeSeriesUpdateInput,
): Promise<CodeSeries> {
  const response = await fetch("/api/master/code-series", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  return parseEnvelope<CodeSeries>(response);
}
