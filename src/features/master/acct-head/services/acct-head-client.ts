/**
 * Browser-safe Account Main Head helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  AcctHead,
  AcctHeadCreateInput,
  AcctHeadListQuery,
  AcctHeadListResult,
  AcctHeadUpdateInput,
} from "@/features/master/acct-head/types/acct-head.types";

export type AcctHeadClientError = {
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
    const error: AcctHeadClientError = {
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

export function isAcctHeadClientError(
  value: unknown,
): value is AcctHeadClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as AcctHeadClientError).message === "string"
  );
}

function listQueryKey(query: AcctHeadListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.mainhdId != null) params.set("mainhd_id", String(query.mainhdId));
  if (query.categId != null) params.set("categ_id", String(query.categId));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchAcctHeadList(
  query: AcctHeadListQuery = {},
): Promise<AcctHeadListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:acct-head:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.acctHead}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<AcctHeadListResult>(response);
    },
    0,
  );
}

export async function createAcctHead(
  input: AcctHeadCreateInput,
): Promise<AcctHead> {
  const response = await fetch(endpoints.bff.acctHead, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<AcctHead>(response);
  clearDedupe();
  return data;
}

export async function updateAcctHead(
  input: AcctHeadUpdateInput,
): Promise<AcctHead> {
  const response = await fetch(endpoints.bff.acctHead, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<AcctHead>(response);
  clearDedupe();
  return data;
}
