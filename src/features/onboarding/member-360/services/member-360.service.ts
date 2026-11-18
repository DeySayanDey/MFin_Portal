import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { legacyRecordId, sameRecordCode } from "@/lib/navigation/record-code";
import { listMembers } from "@/features/onboarding/member-registration/services/member.service";
import type { LaravelResponse } from "@/types/api";
import { mapMember360Dto } from "../mappers/member-360.mapper";
import { member360DtoSchema } from "../schemas/member-360.schema";
import type { Member360 } from "../types/member-360.types";

type Scope = { branchId?: number };

const SEARCH_LIMIT = 20;

async function withToken<T>(run: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({ message: "Unauthorized. Bearer token required.", status: 401, code: "UNAUTHORIZED" });
  }
  try {
    return await run(token);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) await clearAuthSession();
    throw error;
  }
}

function notFound(): ApiError {
  return new ApiError({ message: "Member not found", status: 404, code: "NOT_FOUND" });
}

/** Finds a member by code, reference code or legacy id, within the caller's branch. */
export async function resolveMember360Id(code: string, scope: Scope): Promise<number> {
  const { items } = await listMembers({ keyword: code, branchId: scope.branchId, page: 1, perPage: SEARCH_LIMIT });
  const match = items.find(
    (member) =>
      sameRecordCode(String(member.memberCode ?? ""), code) ||
      (member.refCode != null && sameRecordCode(member.refCode, code)),
  );
  if (match) return match.memberId;

  const legacyId = legacyRecordId(code);
  if (legacyId == null) throw notFound();
  const byId = await listMembers({ memberId: legacyId, branchId: scope.branchId, page: 1, perPage: 1 });
  if (!byId.items.some((member) => member.memberId === legacyId)) throw notFound();
  return legacyId;
}

/** Laravel: GET /api/Member360Get */
export async function getMember360(memberId: number, scope: Scope): Promise<Member360> {
  if (!Number.isInteger(memberId) || memberId <= 0) throw notFound();
  return withToken(async (token) => {
    const payload = await api.get<LaravelResponse<unknown>>(endpoints.member360.get, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: { member_id: memberId, branch_id: scope.branchId },
    });
    if (!payload || payload.success !== true) {
      throw new ApiError({
        message: payload && typeof payload.message === "string" ? payload.message : "Member not found",
        status: 404,
        code: "NOT_FOUND",
      });
    }
    const parsed = member360DtoSchema.safeParse(payload.data);
    if (!parsed.success) {
      throw new ApiError({ message: "Member 360 response was unexpected", status: 500, code: "UNEXPECTED" });
    }
    const result = mapMember360Dto(parsed.data);
    if (scope.branchId != null && result.profile.branchId !== scope.branchId) {
      throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
    }
    return result;
  });
}
