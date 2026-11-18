/**
 * Browser-safe Account Category helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  AcctCategory,
  AcctCategoryCreateInput,
  AcctCategoryListQuery,
  AcctCategoryListResult,
  AcctCategoryUpdateInput,
} from "@/features/master/acct-category/types/acct-category.types";

export type AcctCategoryClientError = {
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
    const error: AcctCategoryClientError = {
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

export function isAcctCategoryClientError(
  value: unknown,
): value is AcctCategoryClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as AcctCategoryClientError).message === "string"
  );
}

function listQueryKey(query: AcctCategoryListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.categId != null) params.set("categ_id", String(query.categId));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.categoryType) params.set("categy_type", query.categoryType);
  return params.toString() || "default";
}

export async function fetchAcctCategoryList(
  query: AcctCategoryListQuery = {},
): Promise<AcctCategoryListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:acct-category:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.acctCategory}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<AcctCategoryListResult>(response);
    },
    0,
  );
}

export async function createAcctCategory(
  input: AcctCategoryCreateInput,
): Promise<AcctCategory> {
  const response = await fetch(endpoints.bff.acctCategory, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<AcctCategory>(response);
  clearDedupe();
  return data;
}

export async function updateAcctCategory(
  input: AcctCategoryUpdateInput,
): Promise<AcctCategory> {
  const response = await fetch(endpoints.bff.acctCategory, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<AcctCategory>(response);
  clearDedupe();
  return data;
}
