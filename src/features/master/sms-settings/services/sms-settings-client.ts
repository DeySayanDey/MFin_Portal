/**
 * Browser-safe SMS Settings helpers.
 * Calls Next.js BFF only — never Laravel and never the Bearer token.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  SmsSettings,
  SmsSettingsUpdateInput,
} from "@/features/master/sms-settings/types/sms-settings.types";

export type SmsSettingsClientError = {
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
    const error: SmsSettingsClientError = {
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

export function isSmsSettingsClientError(
  value: unknown,
): value is SmsSettingsClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as SmsSettingsClientError).message === "string"
  );
}

export async function fetchSmsSettings(): Promise<SmsSettings> {
  return dedupeRequest("master:sms-settings", async () => {
    const response = await fetch(endpoints.bff.smsSettings, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });
    return parseEnvelope<SmsSettings>(response);
  });
}

export async function saveSmsSettings(
  input: SmsSettingsUpdateInput,
): Promise<SmsSettings> {
  const response = await fetch(endpoints.bff.smsSettings, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<SmsSettings>(response);
  clearDedupe("master:sms-settings");
  return data;
}
