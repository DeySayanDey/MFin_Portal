/**
 * Browser-safe Subledger↔Branch mapping helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  AcctSubledgerBranch,
  AcctSubledgerBranchCreateInput,
  AcctSubledgerBranchListQuery,
  AcctSubledgerBranchListResult,
  AcctSubledgerBranchUpdateInput,
} from "@/features/master/acct-subledger-branch/types/acct-subledger-branch.types";

export type AcctSubledgerBranchClientError = {
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
    const error: AcctSubledgerBranchClientError = {
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

export function isAcctSubledgerBranchClientError(
  value: unknown,
): value is AcctSubledgerBranchClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as AcctSubledgerBranchClientError).message === "string"
  );
}

function listQueryKey(query: AcctSubledgerBranchListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.id != null) params.set("id", String(query.id));
  if (query.subledgId != null)
    params.set("subledg_id", String(query.subledgId));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchAcctSubledgerBranchList(
  query: AcctSubledgerBranchListQuery = {},
): Promise<AcctSubledgerBranchListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:acct-subledger-branch:${qs}`,
    async () => {
      const response = await fetch(
        `${endpoints.bff.acctSubledgerBranch}${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      return parseEnvelope<AcctSubledgerBranchListResult>(response);
    },
    0,
  );
}

export async function createAcctSubledgerBranch(
  input: AcctSubledgerBranchCreateInput,
): Promise<AcctSubledgerBranch> {
  const response = await fetch(endpoints.bff.acctSubledgerBranch, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<AcctSubledgerBranch>(response);
  clearDedupe();
  return data;
}

export async function updateAcctSubledgerBranch(
  input: AcctSubledgerBranchUpdateInput,
): Promise<AcctSubledgerBranch> {
  const response = await fetch(endpoints.bff.acctSubledgerBranch, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<AcctSubledgerBranch>(response);
  clearDedupe();
  return data;
}
