/**
 * Browser-safe Deposit Schemes helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  DepositSchemeCharge,
  DepositSchemeChargeAssignResult,
  DepositSchemeChargeListQuery,
  DepositSchemeChargeListResult,
  DepositSchemeChargeSaveInput,
  DepositSchemeListQuery,
  DepositSchemeListResult,
  DepositSchemeSetup,
  DepositSchemeSetupSaveInput,
  PaginationMeta,
} from "../types/deposit-schemes.types";

export type DepositSchemesClientError = {
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
    const error: DepositSchemesClientError = {
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

export function isDepositSchemesClientError(
  value: unknown,
): value is DepositSchemesClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as DepositSchemesClientError).message === "string"
  );
}

function listQueryKey(query: DepositSchemeListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.search) params.set("search", query.search);
  if (query.depositTypeCd != null)
    params.set("deposit_type_cd", String(query.depositTypeCd));
  if (query.prodTypeCd != null)
    params.set("prod_type_cd", String(query.prodTypeCd));
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchDepositSchemeSetups(
  query: DepositSchemeListQuery = {},
): Promise<DepositSchemeListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:deposit-schemes:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositSchemes}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<DepositSchemeListResult>(response);
    },
    0,
  );
}

export async function getAllDepositSchemeSetups(): Promise<
  { id: number; schemeName: string }[]
> {
  try {
    const result = await fetchDepositSchemeSetups({ perPage: 200, isActive: 1 });
    return result.items.map((s) => ({ id: s.id, schemeName: s.schemeName }));
  } catch {
    return [];
  }
}

export async function saveDepositSchemeSetup(
  input: DepositSchemeSetupSaveInput,
): Promise<DepositSchemeSetup> {
  const isUpdate = Boolean(input.schemeId);
  const response = await fetch(endpoints.bff.depositSchemes, {
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
  return parseEnvelope<DepositSchemeSetup>(response);
}

export async function toggleDepositSchemeStatus(
  schemeId: number,
  isActive: boolean,
): Promise<DepositSchemeSetup> {
  const response = await fetch(endpoints.bff.depositSchemes, {
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
  return parseEnvelope<DepositSchemeSetup>(response);
}

function chargesQueryKey(query: DepositSchemeChargeListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.id != null) params.set("id", String(query.id));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.chargesId != null) params.set("charges_id", String(query.chargesId));
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  if (query.includeDetails) params.set("include_details", "1");
  return params.toString() || "default";
}

export async function fetchDepositSchemeCharges(
  query: DepositSchemeChargeListQuery = {},
): Promise<DepositSchemeChargeListResult> {
  const qs = chargesQueryKey(query);
  return dedupeRequest(
    `master:deposit-scheme-charges:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositSchemeCharges}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<DepositSchemeChargeListResult>(response);
    },
    0,
  );
}

export async function saveDepositSchemeCharge(
  input: DepositSchemeChargeSaveInput,
): Promise<DepositSchemeChargeAssignResult> {
  const response = await fetch(endpoints.bff.depositSchemeCharges, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: input.mode === "edit" ? "update" : "create",
      schemeId: input.schemeId,
      chargesIds: input.chargesIds,
    }),
  });
  const data = await parseEnvelope<DepositSchemeChargeAssignResult>(response);
  clearDedupe();
  return data;
}

export async function toggleDepositSchemeChargeStatus(
  id: number,
  isActive: boolean,
): Promise<DepositSchemeCharge> {
  const response = await fetch(endpoints.bff.depositSchemeCharges, {
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
  const data = await parseEnvelope<DepositSchemeCharge>(response);
  clearDedupe();
  return data;
}

