/**
 * Browser-safe security policy helpers.
 * Calls the Next.js BFF only — never Laravel and never the Bearer token.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  LoginSecurityDraft,
  SecurityPolicy,
} from "@/features/security/login-settings/types/login-settings.types";

export type SecurityPolicyClientError = {
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
    const error: SecurityPolicyClientError = {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
      details: payload.errors ?? null,
      code:
        response.status === 401
          ? "UNAUTHORIZED"
          : response.status === 403
            ? "FORBIDDEN"
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

export function isSecurityPolicyClientError(
  value: unknown,
): value is SecurityPolicyClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as SecurityPolicyClientError).message === "string"
  );
}

export async function fetchSecurityPolicy(): Promise<SecurityPolicy> {
  return dedupeRequest("security:policy", async () => {
    const response = await fetch(endpoints.bff.securityPolicy, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });
    return parseEnvelope<SecurityPolicy>(response);
  });
}

export async function saveSecurityPolicy(
  input: LoginSecurityDraft,
): Promise<SecurityPolicy> {
  const response = await fetch(endpoints.bff.securityPolicy, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<SecurityPolicy>(response);
  clearDedupe("security:policy");
  return data;
}
