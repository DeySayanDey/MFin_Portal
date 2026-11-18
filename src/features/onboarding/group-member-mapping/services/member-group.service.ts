import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import type {
  AssignInput,
  EditMembershipInput,
  ExitInput,
  GroupMembership,
  MemberGroupCheck,
  MembershipListQuery,
  MembershipListResult,
  ReassignInput,
  ReassignResult,
} from "@/features/onboarding/group-member-mapping/types/member-group.types";

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

function mapMembership(row: Raw): GroupMembership {
  return {
    memGroupId: numberValue(row, "mem_group_id") ?? 0,
    memberId: numberValue(row, "member_id") ?? 0,
    memberCode: text(row, "member_code"),
    memberRefCode: text(row, "member_ref_code"),
    memberName: text(row, "member_name") ?? "",
    genderCd: numberValue(row, "gender_cd"),
    genderDesc: text(row, "gender_desc"),
    mobileNo: text(row, "mobile_no"),
    memberStatusCd: numberValue(row, "member_status_cd"),
    memberStatusDesc: text(row, "member_status_desc"),
    groupId: numberValue(row, "group_id") ?? 0,
    groupCode: text(row, "group_code"),
    groupRefCode: text(row, "group_ref_code"),
    groupName: text(row, "group_name") ?? "",
    groupTypeCd: numberValue(row, "group_type_cd"),
    groupTypeDesc: text(row, "group_type_desc"),
    groupStatusCd: numberValue(row, "group_status_cd"),
    groupStatusDesc: text(row, "group_status_desc"),
    branchId: numberValue(row, "branch_id"),
    branchCode: text(row, "branch_code"),
    branchName: text(row, "branch_name"),
    centerId: numberValue(row, "center_id"),
    centerName: text(row, "center_name"),
    foId: numberValue(row, "fo_id"),
    foCode: text(row, "fo_code"),
    foName: text(row, "fo_name"),
    memberRole: text(row, "member_role") ?? "Member",
    joinDate: text(row, "join_date"),
    exitDate: text(row, "exit_date"),
    exitReason: text(row, "exit_reason"),
    isActive: boolValue(row, "is_active"),
    createdBy: text(row, "created_by"),
    createdByName: text(row, "created_by_name"),
    createdAt: text(row, "created_at"),
    updatedBy: text(row, "updated_by"),
    updatedAt: text(row, "updated_at"),
  };
}

function mapCheck(row: Raw, message: string): MemberGroupCheck {
  return {
    memberId: numberValue(row, "member_id") ?? 0,
    memberName: text(row, "member_name") ?? "",
    memberStatusCd: numberValue(row, "member_status_cd"),
    memGroupId: numberValue(row, "mem_group_id"),
    groupId: numberValue(row, "group_id"),
    groupName: text(row, "group_name"),
    memberRole: text(row, "member_role"),
    joinDate: text(row, "join_date"),
    activeLoanCount: numberValue(row, "active_loan_count") ?? 0,
    canChange: boolValue(row, "can_change"),
    message,
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

export async function listMemberships(query: MembershipListQuery = {}): Promise<MembershipListResult> {
  return run(async (accessToken) => {
    const perPage = Math.min(200, Math.max(1, query.perPage ?? 50));
    const payload = await api.get<LaravelResponse<Raw[]>>(endpoints.memberGroup.list, {
      accessToken,
      expectEnvelope: false,
      searchParams: {
        page: query.page ?? 1,
        per_page: perPage,
        mem_group_id: query.memGroupId,
        member_id: query.memberId,
        group_id: query.groupId,
        branch_id: query.branchId,
        center_id: query.centerId,
        member_role: query.memberRole,
        is_active: query.isActive == null ? undefined : query.isActive ? 1 : 0,
        keyword: query.keyword,
      },
    });
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const meta = payload.meta;
    return {
      items: rows.map(mapMembership),
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

export async function checkMemberGroup(memberId: number): Promise<MemberGroupCheck> {
  return run(async (accessToken) => {
    const payload = await api.get<LaravelResponse<Raw>>(endpoints.memberGroup.check, {
      accessToken,
      expectEnvelope: false,
      searchParams: { member_id: memberId },
    });
    assertSuccess(payload);
    return mapCheck(payload.data ?? {}, payload.message ?? "");
  });
}

export async function assignMembers(input: AssignInput): Promise<{ message: string; items: GroupMembership[] }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw[]>>(
      endpoints.memberGroup.assign,
      {
        group_id: input.groupId,
        join_date: input.joinDate,
        members: input.members.map((member) => ({
          member_id: member.memberId,
          member_role: member.memberRole,
        })),
      },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return { message: payload.message, items: rows.map(mapMembership) };
  });
}

export async function reassignMember(input: ReassignInput): Promise<{ message: string; result: ReassignResult }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<{ previous?: Raw; current?: Raw }>>(
      endpoints.memberGroup.reassign,
      {
        member_id: input.memberId,
        group_id: input.groupId,
        member_role: input.memberRole,
        transfer_date: input.transferDate,
        reason: input.reason,
      },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    const data = payload.data ?? {};
    return {
      message: payload.message,
      result: {
        previous: data.previous ? mapMembership(data.previous) : null,
        current: data.current ? mapMembership(data.current) : null,
      },
    };
  });
}

export async function editMembership(input: EditMembershipInput): Promise<{ message: string; item: GroupMembership }> {
  return run(async (accessToken) => {
    const body: Record<string, unknown> = { mem_group_id: input.memGroupId };
    if ("memberRole" in input) body.member_role = input.memberRole ?? null;
    if ("foId" in input) body.fo_id = input.foId ?? null;
    if (input.joinDate) body.join_date = input.joinDate;
    const payload = await api.post<LaravelResponse<Raw>>(endpoints.memberGroup.edit, body, {
      accessToken,
      expectEnvelope: false,
    });
    assertSuccess(payload);
    return { message: payload.message, item: mapMembership(payload.data ?? {}) };
  });
}

export async function exitMember(input: ExitInput): Promise<{ message: string; item: GroupMembership }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw>>(
      endpoints.memberGroup.exit,
      {
        member_id: input.memberId,
        reason: input.reason,
        exit_date: input.exitDate,
      },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message, item: mapMembership(payload.data ?? {}) };
  });
}
