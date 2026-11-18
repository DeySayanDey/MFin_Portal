/**
 * Browser-safe Loan Account helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  LoanAccountListQuery,
  LoanAccountListResult,
  PaginationMeta,
} from "../types/loan-account.types";

export type LoanAccountClientError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta | null;
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
    const error: LoanAccountClientError = {
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

export function isLoanAccountClientError(
  value: unknown,
): value is LoanAccountClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as LoanAccountClientError).message === "string"
  );
}

function listQueryKey(query: LoanAccountListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.statusCd != null) params.set("status_cd", String(query.statusCd));
  if (query.isDefaulter != null) {
    params.set("is_defaulter", query.isDefaulter ? "1" : "0");
  }
  if (query.isNpa != null) params.set("is_npa", query.isNpa ? "1" : "0");
  if (query.search) params.set("search", query.search);
  if (query.fromDate) params.set("from_date", query.fromDate);
  if (query.toDate) params.set("to_date", query.toDate);
  return params.toString() || "default";
}

export async function fetchLoanAccounts(
  query: LoanAccountListQuery = {},
): Promise<LoanAccountListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `lms:loan-accounts:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.loanAccounts}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<LoanAccountListResult>(response);
    },
    0,
  );
}
