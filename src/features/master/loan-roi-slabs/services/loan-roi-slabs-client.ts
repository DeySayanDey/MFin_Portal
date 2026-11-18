/**
 * Browser-safe Loan Interest Slab helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  LoanSchemeSlab,
  LoanSchemeSlabListQuery,
  LoanSchemeSlabListResult,
  LoanSchemeSlabSaveInput,
  PaginationMeta,
} from "../types/loan-roi-slabs.types";

export type LoanRoiSlabsClientError = {
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
    const error: LoanRoiSlabsClientError = {
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

export function isLoanRoiSlabsClientError(
  value: unknown,
): value is LoanRoiSlabsClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as LoanRoiSlabsClientError).message === "string"
  );
}

function slabsQueryKey(query: LoanSchemeSlabListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.id != null) params.set("id", String(query.id));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.amount != null) params.set("amount", String(query.amount));
  if (query.effectiveOn) params.set("effective_on", query.effectiveOn);
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchLoanSchemeSlabs(
  query: LoanSchemeSlabListQuery = {},
): Promise<LoanSchemeSlabListResult> {
  const qs = slabsQueryKey(query);
  return dedupeRequest(
    `master:loan-roi-slabs:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.loanRoiSlabs}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<LoanSchemeSlabListResult>(response);
    },
    0,
  );
}

export async function saveLoanSchemeSlab(
  input: LoanSchemeSlabSaveInput,
): Promise<LoanSchemeSlab> {
  const isUpdate = Boolean(input.id);
  const response = await fetch(endpoints.bff.loanRoiSlabs, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: isUpdate ? "update" : "create",
      ...input,
    }),
  });
  return parseEnvelope<LoanSchemeSlab>(response);
}

export async function toggleLoanSchemeSlabStatus(
  id: number,
  isActive: boolean,
): Promise<LoanSchemeSlab> {
  const response = await fetch(endpoints.bff.loanRoiSlabs, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: "status",
      id,
      isActive,
    }),
  });
  return parseEnvelope<LoanSchemeSlab>(response);
}
