import { endpoints } from "@/lib/api/endpoints";
import type {
  GroupKycDocument,
  GroupKycListQuery,
  GroupKycListResult,
  GroupKycSaveInput,
  GroupKycStatusInput,
  GroupKycVerifyInput,
} from "@/features/onboarding/group-kyc/types/group-kyc.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type GroupKycClientError = { status: number; message: string };

async function parse<T>(response: Response): Promise<{ message: string; data: T }> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false) {
    throw {
      status: response.status || 500,
      message: payload.message || "Group KYC request failed",
    } satisfies GroupKycClientError;
  }
  return { message: payload.message ?? "", data: payload.data as T };
}

export function isGroupKycClientError(value: unknown): value is GroupKycClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

async function post<T>(body: Record<string, unknown>): Promise<{ message: string; data: T }> {
  return parse<T>(
    await fetch(endpoints.bff.groupKyc, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function fetchGroupKyc(
  query: GroupKycListQuery,
  signal?: AbortSignal,
): Promise<GroupKycListResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: query.page,
    per_page: query.perPage,
    group_kyc_id: query.groupKycId,
    group_id: query.groupId,
    doc_type_cd: query.docTypeCd,
    verify_status: query.verifyStatus,
    is_active: query.isActive == null ? undefined : query.isActive ? 1 : 0,
  })) {
    if (value != null) params.set(key, String(value));
  }
  const result = await parse<GroupKycListResult>(
    await fetch(`${endpoints.bff.groupKyc}?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    }),
  );
  return result.data ?? { items: [], total: 0 };
}

export async function saveGroupKyc(
  input: GroupKycSaveInput,
): Promise<{ message: string; item: GroupKycDocument }> {
  const result = await post<GroupKycDocument>({ action: "save", ...input });
  return { message: result.message, item: result.data };
}

export async function verifyGroupKyc(
  input: GroupKycVerifyInput,
): Promise<{ message: string; item: GroupKycDocument }> {
  const result = await post<GroupKycDocument>({ action: "verify", ...input });
  return { message: result.message, item: result.data };
}

export async function changeGroupKycStatus(
  input: GroupKycStatusInput,
): Promise<{ message: string; item: GroupKycDocument }> {
  const result = await post<GroupKycDocument>({ action: "status", ...input });
  return { message: result.message, item: result.data };
}
