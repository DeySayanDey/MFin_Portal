/**
 * Browser-safe Global Settings helpers.
 * Calls Next.js BFF only — never Laravel and never the Bearer token.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  GlobalSettingsUpdateInput,
  GlobalSettingsView,
} from "@/features/master/global-settings/types/global-settings.types";

export type GlobalSettingsClientError = {
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
    const error: GlobalSettingsClientError = {
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

export function isGlobalSettingsClientError(value: unknown): value is GlobalSettingsClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as GlobalSettingsClientError).message === "string"
  );
}

export async function fetchGlobalSettings(): Promise<GlobalSettingsView> {
  return dedupeRequest("master:global-settings", async () => {
    const response = await fetch(endpoints.bff.globalSettings, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });
    return parseEnvelope<GlobalSettingsView>(response);
  });
}

export async function saveGlobalSettings(
  input: GlobalSettingsUpdateInput,
): Promise<GlobalSettingsView> {
  const response = await fetch(endpoints.bff.globalSettings, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<GlobalSettingsView>(response);
  clearDedupe("master:global-settings");
  clearDedupe("security:policy");
  return data;
}
