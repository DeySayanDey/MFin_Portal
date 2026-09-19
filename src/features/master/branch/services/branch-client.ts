/**
 * Browser-safe Branch helpers — BFF only, never Laravel token.
 */

import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  Branch,
  BranchCreateInput,
  BranchListQuery,
  BranchListResult,
  BranchMutationResult,
  BranchUpdateInput,
} from "@/features/master/branch/types/branch.types";

export type BranchClientError = {
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
    const error: BranchClientError = {
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

export function isBranchClientError(value: unknown): value is BranchClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as BranchClientError).message === "string"
  );
}

function listQueryKey(query: BranchListQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.perPage != null) params.set("per_page", String(query.perPage));
  if (query.branchId != null) params.set("branch_id", String(query.branchId));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.isHead != null) params.set("is_head", String(query.isHead));
  if (query.isActive != null) params.set("is_active", String(query.isActive));
  return params.toString() || "default";
}

export async function fetchBranchList(
  query: BranchListQuery = {},
): Promise<BranchListResult> {
  const qs = listQueryKey(query);
  return dedupeRequest(
    `master:branch:${qs}`,
    async () => {
      const response = await fetch(
        `/api/master/branch${qs === "default" ? "" : `?${qs}`}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "same-origin",
        },
      );
      return parseEnvelope<BranchListResult>(response);
    },
    0,
  );
}

export async function createBranch(
  input: BranchCreateInput,
): Promise<BranchMutationResult> {
  const response = await fetch("/api/master/branch", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "create", ...input }),
  });
  const data = await parseEnvelope<BranchMutationResult>(response);
  clearDedupe();
  return data;
}

export async function updateBranch(
  input: BranchUpdateInput,
): Promise<BranchMutationResult> {
  const response = await fetch("/api/master/branch", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ action: "update", ...input }),
  });
  const data = await parseEnvelope<BranchMutationResult>(response);
  clearDedupe();
  return data;
}

export async function fetchBranch(branchId: number): Promise<Branch | null> {
  const result = await fetchBranchList({ branchId, page: 1, perPage: 1 });
  return result.items[0] ?? null;
}
