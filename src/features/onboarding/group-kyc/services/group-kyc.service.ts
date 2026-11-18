import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import type {
  GroupKycDocument,
  GroupKycListQuery,
  GroupKycListResult,
  GroupKycSaveInput,
  GroupKycStatusInput,
  GroupKycVerifyInput,
  KycVerifyStatus,
} from "@/features/onboarding/group-kyc/types/group-kyc.types";

type Raw = Record<string, unknown>;

function getField(row: Raw, ...aliases: string[]): unknown {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) return row[alias];
  }
  const targets = new Set(aliases.map((alias) => alias.toLowerCase().replace(/_/g, "")));
  for (const [key, value] of Object.entries(row)) {
    if (value == null) continue;
    if (targets.has(key.toLowerCase().replace(/_/g, ""))) return value;
  }
  return undefined;
}

function text(row: Raw, ...keys: string[]): string | null {
  const value = getField(row, ...keys);
  if (value == null) return null;
  const next = String(value).trim();
  return next === "" || next.toUpperCase() === "NULL" ? null : next;
}

function numberValue(row: Raw, ...keys: string[]): number | null {
  const value = getField(row, ...keys);
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolValue(row: Raw, ...keys: string[]): boolean {
  const value = getField(row, ...keys);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return value === "1" || value.toLowerCase() === "true";
  return false;
}

function mapDocument(row: Raw): GroupKycDocument {
  const verify = numberValue(row, "verify_status") ?? 0;
  return {
    groupKycId: numberValue(row, "group_kyc_id") ?? 0,
    groupId: numberValue(row, "group_id") ?? 0,
    groupCode: text(row, "group_code"),
    groupName: text(row, "group_name") ?? "",
    branchId: numberValue(row, "branch_id"),
    branchName: text(row, "branch_name"),
    docTypeCd: numberValue(row, "doc_type_cd") ?? 0,
    docTypeDesc: text(row, "doc_type_desc"),
    kycNo: text(row, "kyc_no") ?? "",
    issueDate: text(row, "issue_date"),
    expiryDate: text(row, "expiry_date"),
    isExpired: boolValue(row, "is_expired"),
    verifyStatus: (verify === 1 || verify === 2 ? verify : 0) as KycVerifyStatus,
    verifyRemarks: text(row, "verify_remarks"),
    verifiedByName: text(row, "verified_by_name"),
    verifiedAt: text(row, "verified_at"),
    photoPath: text(row, "photo_path"),
    backPhotoPath: text(row, "back_photo_path"),
    isActive: boolValue(row, "is_active"),
    createdByName: text(row, "created_by_name"),
    createdAt: text(row, "created_at"),
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
    throw new ApiError({
      message: payload.message || "Request failed",
      status: 422,
      code: "VALIDATION",
    });
  }
}

/** Laravel: GET /api/GroupKycList */
export async function listGroupKyc(query: GroupKycListQuery = {}): Promise<GroupKycListResult> {
  return run(async (accessToken) => {
    const perPage = Math.min(200, Math.max(1, query.perPage ?? 50));
    const payload = await api.get<LaravelResponse<Raw[]>>(endpoints.groupKyc.list, {
      accessToken,
      expectEnvelope: false,
      searchParams: {
        page: query.page ?? 1,
        per_page: perPage,
        group_kyc_id: query.groupKycId,
        group_id: query.groupId,
        branch_id: query.branchId,
        doc_type_cd: query.docTypeCd,
        verify_status: query.verifyStatus,
        is_active: query.isActive == null ? undefined : query.isActive ? 1 : 0,
      },
    });
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return { items: rows.map(mapDocument), total: payload.meta?.total ?? rows.length };
  });
}

/** Laravel: POST /api/GroupKycAdd or /api/GroupKycEdit */
export async function saveGroupKyc(
  input: GroupKycSaveInput,
): Promise<{ message: string; item: GroupKycDocument }> {
  return run(async (accessToken) => {
    const body = {
      group_id: input.groupId,
      doc_type_cd: input.docTypeCd,
      kyc_no: input.kycNo,
      issue_date: input.issueDate,
      expiry_date: input.expiryDate,
      photo_path: input.photoPath,
      back_photo_path: input.backPhotoPath,
    };
    const payload = await api.post<LaravelResponse<Raw>>(
      input.groupKycId ? endpoints.groupKyc.edit : endpoints.groupKyc.add,
      input.groupKycId ? { ...body, group_kyc_id: input.groupKycId } : body,
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message, item: mapDocument(payload.data ?? {}) };
  });
}

/** Laravel: POST /api/GroupKycVerify */
export async function verifyGroupKyc(
  input: GroupKycVerifyInput,
): Promise<{ message: string; item: GroupKycDocument }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw>>(
      endpoints.groupKyc.verify,
      {
        group_kyc_id: input.groupKycId,
        verify_status: input.verifyStatus,
        remarks: input.remarks ?? null,
      },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message, item: mapDocument(payload.data ?? {}) };
  });
}

/** Laravel: POST /api/GroupKycStatus */
export async function changeGroupKycStatus(
  input: GroupKycStatusInput,
): Promise<{ message: string; item: GroupKycDocument }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw>>(
      endpoints.groupKyc.status,
      { group_kyc_id: input.groupKycId, is_active: input.isActive ? 1 : 0 },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message, item: mapDocument(payload.data ?? {}) };
  });
}
