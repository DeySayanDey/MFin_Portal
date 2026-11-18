import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import type {
  KycAddInput,
  KycEditInput,
  KycStatusInput,
  KycVerifyInput,
  KycVerifyStatus,
  MemberKycDocument,
  MemberKycListQuery,
  MemberKycListResult,
} from "@/features/onboarding/member-kyc/types/member-kyc.types";

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
  return next === "" ? null : next;
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

function mapDocument(row: Raw): MemberKycDocument {
  const verify = numberValue(row, "verify_status") ?? 0;
  return {
    memberKycId: numberValue(row, "member_kyc_id") ?? 0,
    memberId: numberValue(row, "member_id") ?? 0,
    memberCode: text(row, "member_code"),
    refCode: text(row, "ref_code"),
    memberName: text(row, "member_name") ?? "",
    mobileNo: text(row, "mobile_no"),
    memberStatusCd: numberValue(row, "member_status_cd"),
    memberStatusDesc: text(row, "member_status_desc"),
    branchId: numberValue(row, "branch_id"),
    branchCode: text(row, "branch_code"),
    branchName: text(row, "branch_name"),
    docTypeCd: numberValue(row, "doc_type_cd") ?? 0,
    docTypeDesc: text(row, "doc_type_desc"),
    kycNo: text(row, "kyc_no") ?? "",
    kycNoMasked: text(row, "kyc_no_masked"),
    issueDate: text(row, "issue_date"),
    expiryDate: text(row, "expiry_date"),
    isExpired: boolValue(row, "is_expired"),
    verifyStatus: (verify === 1 || verify === 2 ? verify : 0) as KycVerifyStatus,
    verifyStatusDesc: text(row, "verify_status_desc"),
    verifyRemarks: text(row, "verify_remarks"),
    verifiedBy: text(row, "verified_by"),
    verifiedByName: text(row, "verified_by_name"),
    verifiedAt: text(row, "verified_at"),
    photoPath: text(row, "photo_path"),
    backPhotoPath: text(row, "back_photo_path"),
    isActive: boolValue(row, "is_active"),
    createdBy: text(row, "created_by"),
    createdByName: text(row, "created_by_name"),
    createdAt: text(row, "created_at"),
    updatedBy: text(row, "updated_by"),
    updatedAt: text(row, "updated_at"),
  };
}

async function token(): Promise<string> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new ApiError({ message: "Unauthorized", status: 401, code: "UNAUTHORIZED" });
  }
  return accessToken;
}

async function run<T>(work: (accessToken: string) => Promise<T>): Promise<T> {
  const accessToken = await token();
  try {
    return await work(accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await clearAuthSession();
    throw error;
  }
}

function assertSuccess<T>(payload: LaravelResponse<T>): asserts payload is Extract<LaravelResponse<T>, { success: true }> {
  if (!payload.success) {
    throw new ApiError({
      message: payload.message || "Request failed",
      status: 422,
      code: "VALIDATION",
    });
  }
}

export async function listMemberKyc(query: MemberKycListQuery = {}): Promise<MemberKycListResult> {
  return run(async (accessToken) => {
    const perPage = Math.min(200, Math.max(1, query.perPage ?? 50));
    const payload = await api.get<LaravelResponse<Raw[]>>(endpoints.memberKyc.list, {
      accessToken,
      expectEnvelope: false,
      searchParams: {
        page: query.page ?? 1,
        per_page: perPage,
        member_kyc_id: query.memberKycId,
        member_id: query.memberId,
        branch_id: query.branchId,
        doc_type_cd: query.docTypeCd,
        verify_status: query.verifyStatus,
        is_active: query.isActive == null ? undefined : query.isActive ? 1 : 0,
        keyword: query.keyword,
      },
    });
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const meta = payload.meta;
    return {
      items: rows.map(mapDocument),
      meta: {
        total: meta?.total ?? rows.length,
        page: meta?.page ?? query.page ?? 1,
        perPage: meta?.per_page ?? perPage,
        lastPage: meta?.last_page ?? 1,
        hasMore: meta?.has_more ?? false,
      },
    };
  });
}

export async function addMemberKyc(input: KycAddInput): Promise<{ message: string; items: MemberKycDocument[] }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw[]>>(
      endpoints.memberKyc.add,
      {
        member_id: input.memberId,
        documents: input.documents.map((document) => ({
          doc_type_cd: document.docTypeCd,
          kyc_no: document.kycNo,
          issue_date: document.issueDate,
          expiry_date: document.expiryDate,
          photo_path: document.photoPath,
          back_photo_path: document.backPhotoPath,
        })),
      },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return { message: payload.message, items: rows.map(mapDocument) };
  });
}

export async function editMemberKyc(input: KycEditInput): Promise<{ message: string; item: MemberKycDocument }> {
  return run(async (accessToken) => {
    const body: Record<string, unknown> = { member_kyc_id: input.memberKycId };
    if (input.docTypeCd != null) body.doc_type_cd = input.docTypeCd;
    if (input.kycNo != null) body.kyc_no = input.kycNo;
    if ("issueDate" in input) body.issue_date = input.issueDate ?? null;
    if ("expiryDate" in input) body.expiry_date = input.expiryDate ?? null;
    if ("photoPath" in input) body.photo_path = input.photoPath ?? null;
    if ("backPhotoPath" in input) body.back_photo_path = input.backPhotoPath ?? null;
    const payload = await api.post<LaravelResponse<Raw>>(endpoints.memberKyc.edit, body, {
      accessToken,
      expectEnvelope: false,
    });
    assertSuccess(payload);
    return { message: payload.message, item: mapDocument(payload.data ?? {}) };
  });
}

export async function verifyMemberKyc(
  input: KycVerifyInput,
): Promise<{ message: string; items: MemberKycDocument[] }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw | Raw[]>>(
      endpoints.memberKyc.verify,
      {
        member_kyc_id: input.memberKycId,
        member_kyc_ids: input.memberKycIds,
        verify_status: input.verifyStatus,
        remarks: input.remarks,
      },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
    return { message: payload.message, items: rows.map(mapDocument) };
  });
}

export async function changeMemberKycStatus(
  input: KycStatusInput,
): Promise<{ message: string; item: MemberKycDocument }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw>>(
      endpoints.memberKyc.status,
      { member_kyc_id: input.memberKycId, is_active: input.isActive },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message, item: mapDocument(payload.data ?? {}) };
  });
}
