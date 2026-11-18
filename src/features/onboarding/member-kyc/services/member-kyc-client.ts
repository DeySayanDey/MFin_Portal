import { endpoints } from "@/lib/api/endpoints";
import type {
  KycAddInput,
  KycEditInput,
  KycStatusInput,
  KycVerifyInput,
  MemberKycDocument,
  MemberKycListQuery,
  MemberKycListResult,
} from "@/features/onboarding/member-kyc/types/member-kyc.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type MemberKycClientError = { status: number; message: string };

async function parse<T>(response: Response): Promise<{ message: string; data: T }> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false) {
    throw {
      status: response.status || 500,
      message: payload.message || "KYC request failed",
    } satisfies MemberKycClientError;
  }
  return { message: payload.message ?? "", data: payload.data as T };
}

export function isMemberKycClientError(value: unknown): value is MemberKycClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

export async function fetchMemberKyc(query: MemberKycListQuery, signal?: AbortSignal): Promise<MemberKycListResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: query.page,
    per_page: query.perPage,
    member_kyc_id: query.memberKycId,
    member_id: query.memberId,
    branch_id: query.branchId,
    doc_type_cd: query.docTypeCd,
    verify_status: query.verifyStatus,
    is_active: query.isActive == null ? undefined : query.isActive ? 1 : 0,
    keyword: query.keyword,
  })) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const result = await parse<MemberKycListResult>(
    await fetch(`${endpoints.bff.memberKyc}?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    }),
  );
  return result.data;
}

export async function addMemberKyc(input: KycAddInput): Promise<{ message: string; items: MemberKycDocument[] }> {
  const result = await parse<MemberKycDocument[]>(
    await fetch(endpoints.bff.memberKyc, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", ...input }),
    }),
  );
  return { message: result.message, items: result.data ?? [] };
}

export async function editMemberKyc(input: KycEditInput): Promise<{ message: string; item: MemberKycDocument }> {
  const result = await parse<MemberKycDocument>(
    await fetch(endpoints.bff.memberKyc, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", ...input }),
    }),
  );
  return { message: result.message, item: result.data };
}

export async function verifyMemberKyc(input: KycVerifyInput): Promise<{ message: string; items: MemberKycDocument[] }> {
  const result = await parse<MemberKycDocument[]>(
    await fetch(endpoints.bff.memberKyc, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", ...input }),
    }),
  );
  return { message: result.message, items: result.data ?? [] };
}

export async function changeMemberKycStatus(
  input: KycStatusInput,
): Promise<{ message: string; item: MemberKycDocument }> {
  const result = await parse<MemberKycDocument>(
    await fetch(endpoints.bff.memberKyc, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", ...input }),
    }),
  );
  return { message: result.message, item: result.data };
}
