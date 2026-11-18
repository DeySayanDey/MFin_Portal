/**
 * Browser-safe Loan Schemes helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  LoanSchemeCharge,
  LoanSchemeChargeAssignResult,
  LoanSchemeChargeListQuery,
  LoanSchemeChargeListResult,
  LoanSchemeChargeSaveInput,
  LoanSchemeListQuery,
  LoanSchemeListResult,
  LoanSchemeSetup,
  LoanSchemeSetupSaveInput,
  PaginationMeta,
} from "../types/loan-schemes.types";

export type LoanSchemesClientError = {
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
    const error: LoanSchemesClientError = {
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

export function isLoanSchemesClientError(
  value: unknown,
): value is LoanSchemesClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as LoanSchemesClientError).message === "string"
  );
}

function listQueryKey(query: LoanSchemeListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.search) params.set("search", query.search);
  if (query.productTypeCd != null) {
    params.set("product_type_cd", String(query.productTypeCd));
  }
  if (query.repayTypeCd != null) {
    params.set("repay_type_cd", String(query.repayTypeCd));
  }
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchLoanSchemeSetups(
  query: LoanSchemeListQuery = {},
): Promise<LoanSchemeListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:loan-schemes:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.loanSchemes}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<LoanSchemeListResult>(response);
    },
    0,
  );
}

export async function getAllLoanSchemeSetups(): Promise<
  { id: number; schemeName: string }[]
> {
  const items: { id: number; schemeName: string }[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await fetchLoanSchemeSetups({
      page,
      perPage: 200,
      isActive: 1,
    });
    for (const scheme of result.items) {
      items.push({ id: scheme.id, schemeName: scheme.schemeName });
    }
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage && page <= 10);
  return items;
}

export async function saveLoanSchemeSetup(
  input: LoanSchemeSetupSaveInput,
): Promise<LoanSchemeSetup> {
  const isUpdate = Boolean(input.schemeId);
  const response = await fetch(endpoints.bff.loanSchemes, {
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
  return parseEnvelope<LoanSchemeSetup>(response);
}

export async function toggleLoanSchemeStatus(
  schemeId: number,
  isActive: boolean,
): Promise<LoanSchemeSetup> {
  const response = await fetch(endpoints.bff.loanSchemes, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: "status",
      schemeId,
      isActive,
    }),
  });
  return parseEnvelope<LoanSchemeSetup>(response);
}

function chargesQueryKey(query: LoanSchemeChargeListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.id != null) params.set("id", String(query.id));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.chargeId != null) params.set("charge_id", String(query.chargeId));
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchLoanSchemeCharges(
  query: LoanSchemeChargeListQuery = {},
): Promise<LoanSchemeChargeListResult> {
  const qs = chargesQueryKey(query);
  return dedupeRequest(
    `master:loan-scheme-charges:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.loanSchemeCharges}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<LoanSchemeChargeListResult>(response);
    },
    0,
  );
}

export async function saveLoanSchemeCharge(
  input: LoanSchemeChargeSaveInput,
): Promise<LoanSchemeChargeAssignResult> {
  const response = await fetch(endpoints.bff.loanSchemeCharges, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: input.mode === "edit" ? "update" : "create",
      schemeId: input.schemeId,
      chargeIds: input.chargeIds,
    }),
  });
  const data = await parseEnvelope<LoanSchemeChargeAssignResult>(response);
  clearDedupe();
  return data;
}

export async function toggleLoanSchemeChargeStatus(
  id: number,
  isActive: boolean,
): Promise<LoanSchemeCharge> {
  const response = await fetch(endpoints.bff.loanSchemeCharges, {
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
  const data = await parseEnvelope<LoanSchemeCharge>(response);
  clearDedupe();
  return data;
}
