/**
 * Browser-safe WhatsApp Settings helpers — BFF only.
 */

import { endpoints } from "@/lib/api/endpoints";
import { clearDedupe, dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  WhatsAppSettings,
  WhatsAppSettingsUpdateInput,
} from "@/features/master/whatsapp-settings/types/whatsapp-settings.types";

export type WhatsAppSettingsClientError = {
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
    const error: WhatsAppSettingsClientError = {
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

export function isWhatsAppSettingsClientError(
  value: unknown,
): value is WhatsAppSettingsClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    typeof (value as WhatsAppSettingsClientError).message === "string"
  );
}

export async function fetchWhatsAppSettings(): Promise<WhatsAppSettings> {
  return dedupeRequest("master:whatsapp-settings", async () => {
    const response = await fetch(endpoints.bff.whatsAppSettings, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });
    return parseEnvelope<WhatsAppSettings>(response);
  });
}

export async function saveWhatsAppSettings(
  input: WhatsAppSettingsUpdateInput,
): Promise<WhatsAppSettings> {
  const response = await fetch(endpoints.bff.whatsAppSettings, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const data = await parseEnvelope<WhatsAppSettings>(response);
  clearDedupe("master:whatsapp-settings");
  return data;
}
