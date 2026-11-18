/**
 * Browser-safe Loan Eligibility helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  LoanEligibilityListQuery,
  LoanEligibilityListResult,
  LoanEligibilityParameter,
  LoanEligibilitySaveInput,
  PaginationMeta,
} from "../types/loan-eligibility.types";

export type LoanEligibilityClientError = {
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
    const error: LoanEligibilityClientError = {
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

export function isLoanEligibilityClientError(
  value: unknown,
): value is LoanEligibilityClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as LoanEligibilityClientError).message === "string"
  );
}

function listQueryKey(query: LoanEligibilityListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.paramId != null) params.set("param_id", String(query.paramId));
  if (query.search) params.set("search", query.search);
  if (query.dataType) params.set("data_type", query.dataType);
  if (query.isMandatory != null) {
    params.set("is_mandatory", String(query.isMandatory));
  }
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchLoanEligibilityParameters(
  query: LoanEligibilityListQuery = {},
): Promise<LoanEligibilityListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:loan-eligibility:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.loanEligibility}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<LoanEligibilityListResult>(response);
    },
    0,
  );
}

export async function saveLoanEligibilityParameter(
  input: LoanEligibilitySaveInput,
): Promise<LoanEligibilityParameter> {
  const response = await fetch(endpoints.bff.loanEligibility, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: "update",
      ...input,
    }),
  });
  return parseEnvelope<LoanEligibilityParameter>(response);
}

export async function toggleLoanEligibilityStatus(
  paramId: number,
  isActive: boolean,
): Promise<LoanEligibilityParameter> {
  const response = await fetch(endpoints.bff.loanEligibility, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: "status",
      paramId,
      isActive,
    }),
  });
  return parseEnvelope<LoanEligibilityParameter>(response);
}
