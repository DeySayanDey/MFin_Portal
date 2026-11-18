/**
 * Browser-safe MakerChecker helpers — BFF only, never Laravel token.
 */

import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import { endpoints } from "@/lib/api/endpoints";
import type {
  MakerCheckerCreateInput,
  MakerCheckerListQuery,
  MakerCheckerListResult,
  MakerCheckerRule,
  MakerCheckerUpdateInput,
} from "@/features/master/maker-checker/types/maker-checker.types";

export type MakerCheckerClientError = {
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
    const error: MakerCheckerClientError = {
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

export function isMakerCheckerClientError(
  value: unknown,
): value is MakerCheckerClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as MakerCheckerClientError).message === "string"
  );
}

function listQueryKey(query: MakerCheckerListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.id != null) params.set("id", String(query.id));
  if (query.voucherType != null) {
    params.set("voucher_type", String(query.voucherType));
  }
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchMakerCheckerList(
  query: MakerCheckerListQuery = {},
): Promise<MakerCheckerListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:maker-checker:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.makerChecker}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        },
      );
      return parseEnvelope<MakerCheckerListResult>(response);
    },
    0,
  );
}

export async function createMakerCheckerRule(
  input: MakerCheckerCreateInput,
): Promise<MakerCheckerRule> {
  const response = await fetch(endpoints.bff.makerChecker, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<MakerCheckerRule>(response);
  clearDedupe();
  return data;
}

export async function updateMakerCheckerRule(
  input: MakerCheckerUpdateInput,
): Promise<MakerCheckerRule> {
  const response = await fetch(endpoints.bff.makerChecker, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<MakerCheckerRule>(response);
  clearDedupe();
  return data;
}
