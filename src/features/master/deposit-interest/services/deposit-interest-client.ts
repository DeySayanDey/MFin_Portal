/**
 * Browser-safe Deposit Interest helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { fetchDepositSchemeSetups } from "@/features/master/deposit-schemes/services/deposit-schemes-client";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  DepositSchemeSlab,
  DepositSchemeSlabListQuery,
  DepositSchemeSlabListResult,
  DepositSchemeSlabSaveInput,
  PaginationMeta,
} from "../types/deposit-interest.types";

export type DepositInterestClientError = {
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
    const error: DepositInterestClientError = {
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

export function isDepositInterestClientError(
  value: unknown,
): value is DepositInterestClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as { status: unknown }).status === "number" &&
    typeof (value as { message: unknown }).message === "string"
  );
}

function slabsQueryKey(query: DepositSchemeSlabListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.id != null) params.set("id", String(query.id));
  if (query.schemeId != null) params.set("scheme_id", String(query.schemeId));
  if (query.termCd != null) params.set("term_cd", String(query.termCd));
  if (query.duration != null) params.set("duration", String(query.duration));
  if (query.effectiveOn) params.set("effective_on", query.effectiveOn);
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  if (query.search) params.set("search", query.search);
  return params.toString() || "default";
}

export async function fetchTermDepositSchemeOptions(): Promise<
  { id: number; schemeName: string }[]
> {
  const options: { id: number; schemeName: string }[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await fetchDepositSchemeSetups({
      page,
      perPage: 200,
      depositTypeCd: 2,
      isActive: 1,
    });
    options.push(...result.items.map(({ id, schemeName }) => ({ id, schemeName })));
    if (!result.meta && result.items.length === 200) {
      throw new Error("Deposit scheme pagination information is missing");
    }
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage);

  return options;
}

export async function fetchDepositSchemeSlabs(
  query: DepositSchemeSlabListQuery = {},
): Promise<DepositSchemeSlabListResult> {
  const qs = slabsQueryKey(query);
  return dedupeRequest(
    `master:deposit-interest-slabs:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.depositInterest}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<DepositSchemeSlabListResult>(response);
    },
    0,
  );
}

export async function saveDepositSchemeSlab(
  input: DepositSchemeSlabSaveInput,
): Promise<DepositSchemeSlab> {
  const response = await fetch(endpoints.bff.depositInterest, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      action: "create",
      ...input,
    }),
  });
  return parseEnvelope<DepositSchemeSlab>(response);
}

export async function toggleDepositSchemeSlabStatus(
  id: number,
  isActive: boolean,
): Promise<DepositSchemeSlab> {
  const response = await fetch(endpoints.bff.depositInterest, {
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
  return parseEnvelope<DepositSchemeSlab>(response);
}
