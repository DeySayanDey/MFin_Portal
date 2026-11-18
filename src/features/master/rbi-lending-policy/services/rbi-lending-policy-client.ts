/**
 * Browser-safe RBI Lending Policy helpers.
 * Calls Next.js BFF only — never Laravel and never the Bearer token.
 */

import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  RbiLendingPolicy,
  RbiLendingPolicyUpdateInput,
} from "@/features/master/rbi-lending-policy/types/rbi-lending-policy.types";

export type RbiLendingPolicyClientError = {
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
    const error: RbiLendingPolicyClientError = {
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

export function isRbiLendingPolicyClientError(
  value: unknown,
): value is RbiLendingPolicyClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as RbiLendingPolicyClientError).message === "string"
  );
}

export async function fetchRbiLendingPolicy(): Promise<RbiLendingPolicy> {
  return dedupeRequest("master:rbi-lending-policy", async () => {
    const response = await fetch("/api/master/rbi-lending-policy", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    return parseEnvelope<RbiLendingPolicy>(response);
  });
}

export async function saveRbiLendingPolicy(
  input: RbiLendingPolicyUpdateInput,
): Promise<RbiLendingPolicy> {
  const response = await fetch("/api/master/rbi-lending-policy", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<RbiLendingPolicy>(response);
  clearDedupe("master:rbi-lending-policy");
  return data;
}
