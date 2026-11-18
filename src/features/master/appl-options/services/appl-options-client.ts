/**
 * Browser-safe Application Options helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type { ApplOption } from "../types/appl-options.types";

export type ApplOptionsClientError = {
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
    const error: ApplOptionsClientError = {
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

export function isApplOptionsClientError(
  value: unknown,
): value is ApplOptionsClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as ApplOptionsClientError).message === "string"
  );
}

export async function fetchApplOptions(
  optGrpId: number,
  includeInactive = false,
): Promise<ApplOption[]> {
  const cacheKey = `appl-options:${optGrpId}:${includeInactive}`;
  return dedupeRequest(
    cacheKey,
    async () => {
      const url = new URL(endpoints.bff.applOptions, window.location.origin);
      url.searchParams.set("opt_grp_id", String(optGrpId));
      if (includeInactive) {
        url.searchParams.set("include_inactive", "true");
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store",
      });

      return parseEnvelope<ApplOption[]>(response);
    },
    30_000,
  );
}
