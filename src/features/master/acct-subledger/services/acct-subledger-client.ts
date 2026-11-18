/**
 * Browser-safe Account Subledger helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  AcctSubledger,
  AcctSubledgerCreateInput,
  AcctSubledgerListQuery,
  AcctSubledgerListResult,
  AcctSubledgerUpdateInput,
} from "@/features/master/acct-subledger/types/acct-subledger.types";

export type AcctSubledgerClientError = {
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
    const error: AcctSubledgerClientError = {
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

export function isAcctSubledgerClientError(
  value: unknown,
): value is AcctSubledgerClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as AcctSubledgerClientError).message === "string"
  );
}

function listQueryKey(query: AcctSubledgerListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.subledgId != null)
    params.set("subledg_id", String(query.subledgId));
  if (query.ledgerId != null) params.set("ledger_id", String(query.ledgerId));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchAcctSubledgerList(
  query: AcctSubledgerListQuery = {},
): Promise<AcctSubledgerListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:acct-subledger:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.acctSubledger}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<AcctSubledgerListResult>(response);
    },
    0,
  );
}

export async function createAcctSubledger(
  input: AcctSubledgerCreateInput,
): Promise<AcctSubledger> {
  const response = await fetch(endpoints.bff.acctSubledger, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<AcctSubledger>(response);
  clearDedupe();
  return data;
}

export async function updateAcctSubledger(
  input: AcctSubledgerUpdateInput,
): Promise<AcctSubledger> {
  const response = await fetch(endpoints.bff.acctSubledger, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<AcctSubledger>(response);
  clearDedupe();
  return data;
}
