/**
 * Browser-safe Account Ledger helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  AcctLedger,
  AcctLedgerCreateInput,
  AcctLedgerListQuery,
  AcctLedgerListResult,
  AcctLedgerUpdateInput,
} from "@/features/master/acct-ledger/types/acct-ledger.types";

export type AcctLedgerClientError = {
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
    const error: AcctLedgerClientError = {
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

export function isAcctLedgerClientError(
  value: unknown,
): value is AcctLedgerClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as AcctLedgerClientError).message === "string"
  );
}

function listQueryKey(query: AcctLedgerListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.ledgerId != null) params.set("ledger_id", String(query.ledgerId));
  if (query.mainhdId != null) params.set("mainhd_id", String(query.mainhdId));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.ledgerType) params.set("ledger_type", query.ledgerType);
  if (query.categName) params.set("categ_name", query.categName);
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchAcctLedgerList(
  query: AcctLedgerListQuery = {},
): Promise<AcctLedgerListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:acct-ledger:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.acctLedger}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<AcctLedgerListResult>(response);
    },
    0,
  );
}

export async function createAcctLedger(
  input: AcctLedgerCreateInput,
): Promise<AcctLedger> {
  const response = await fetch(endpoints.bff.acctLedger, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<AcctLedger>(response);
  clearDedupe();
  return data;
}

export async function updateAcctLedger(
  input: AcctLedgerUpdateInput,
): Promise<AcctLedger> {
  const response = await fetch(endpoints.bff.acctLedger, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<AcctLedger>(response);
  clearDedupe();
  return data;
}
