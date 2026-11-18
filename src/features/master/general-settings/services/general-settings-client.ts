/**
 * Browser-safe General Settings helpers.
 * Calls the Next.js BFF only — never Laravel and never the Bearer token.
 */

import { endpoints } from "@/lib/api/endpoints";
import type {
  GeneralSetting,
  GeneralSettingBulkResult,
  GeneralSettingBulkStatusInput,
  GeneralSettingStatusInput,
} from "@/features/master/general-settings/types/general-settings.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type GeneralSettingsClientError = { status: number; message: string };

async function parse<T>(response: Response): Promise<{ message: string; data: T }> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false) {
    throw {
      status: response.status || 500,
      message: payload.message || `Request failed (${response.status})`,
    } satisfies GeneralSettingsClientError;
  }
  return { message: payload.message ?? "", data: payload.data as T };
}

export function isGeneralSettingsClientError(value: unknown): value is GeneralSettingsClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

export async function fetchGeneralSettings(signal?: AbortSignal): Promise<GeneralSetting[]> {
  const result = await parse<GeneralSetting[]>(
    await fetch(endpoints.bff.generalSettings, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    }),
  );
  return Array.isArray(result.data) ? result.data : [];
}

export async function changeGeneralSettingStatus(
  input: GeneralSettingStatusInput,
): Promise<{ message: string; item: GeneralSetting | null }> {
  const result = await parse<GeneralSetting | null>(
    await fetch(endpoints.bff.generalSettings, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return { message: result.message, item: result.data ?? null };
}

export async function bulkChangeGeneralSettingStatus(
  input: GeneralSettingBulkStatusInput,
): Promise<GeneralSettingBulkResult> {
  const result = await parse<GeneralSetting[]>(
    await fetch(endpoints.bff.generalSettings, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk", ...input }),
    }),
  );
  return { message: result.message, items: Array.isArray(result.data) ? result.data : [] };
}
