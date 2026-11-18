import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import type {
  GeneralSetting,
  GeneralSettingBulkResult,
  GeneralSettingBulkStatusInput,
  GeneralSettingStatusInput,
} from "@/features/master/general-settings/types/general-settings.types";

type Raw = Record<string, unknown>;

function field(row: Raw, ...aliases: string[]): unknown {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) return row[alias];
  }
  return undefined;
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapSetting(row: unknown): GeneralSetting | null {
  if (!row || typeof row !== "object") return null;
  const raw = row as Raw;
  const id = toNumber(field(raw, "id", "Id"));
  if (id == null) return null;
  return {
    id,
    groupNo: toNumber(field(raw, "grp_no", "GrpNo", "group_no")) ?? 0,
    code: String(field(raw, "code", "Code") ?? "").trim(),
    purpose: String(field(raw, "purpose", "Purpose") ?? "").trim(),
    isActive: toNumber(field(raw, "status", "Status")) === 1,
  };
}

async function run<T>(work: (accessToken: string) => Promise<T>): Promise<T> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new ApiError({ message: "Unauthorized", status: 401, code: "UNAUTHORIZED" });
  }
  try {
    return await work(accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await clearAuthSession();
    throw error;
  }
}

function assertSuccess<T>(
  payload: LaravelResponse<T>,
): asserts payload is Extract<LaravelResponse<T>, { success: true }> {
  if (!payload.success) {
    throw new ApiError({ message: payload.message || "Request failed", status: 422, code: "VALIDATION" });
  }
}

/** Laravel: GET /api/GeneralSettingsList */
export async function listGeneralSettings(): Promise<GeneralSetting[]> {
  return run(async (accessToken) => {
    const payload = await api.get<LaravelResponse<unknown[]>>(endpoints.generalSettings.list, {
      accessToken,
      expectEnvelope: false,
    });
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return rows
      .flatMap((row) => {
        const item = mapSetting(row);
        return item ? [item] : [];
      })
      .sort((a, b) => a.groupNo - b.groupNo || a.id - b.id);
  });
}

/** Laravel: POST /api/GeneralSettingsStatus */
export async function changeGeneralSettingStatus(
  input: GeneralSettingStatusInput,
): Promise<{ message: string; item: GeneralSetting | null }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<unknown>>(
      endpoints.generalSettings.status,
      { id: input.id, status: input.isActive ? 1 : 0 },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message ?? "", item: mapSetting(payload.data) };
  });
}

/** Laravel: POST /api/GeneralSettingsBulkStatus */
export async function bulkChangeGeneralSettingStatus(
  input: GeneralSettingBulkStatusInput,
): Promise<GeneralSettingBulkResult> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<unknown[]>>(
      endpoints.generalSettings.bulkStatus,
      { ids: input.ids, status: input.isActive ? 1 : 0 },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return {
      message: payload.message ?? "",
      items: rows.flatMap((row) => {
        const item = mapSetting(row);
        return item ? [item] : [];
      }),
    };
  });
}
