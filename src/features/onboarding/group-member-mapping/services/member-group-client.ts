import { endpoints } from "@/lib/api/endpoints";
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

type Envelope<T> = {
  success?: boolean;
  message?: string;
  warning?: boolean;
  data?: T;
};

export type MemberGroupClientError = {
  status: number;
  message: string;
  warning: boolean;
};

async function parse<T>(response: Response): Promise<{ message: string; data: T }> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false) {
    throw {
      status: response.status || 500,
      message: payload.message || "Group membership request failed",
      warning: payload.warning === true || response.status === 409,
    } satisfies MemberGroupClientError;
  }
  return { message: payload.message ?? "", data: payload.data as T };
}

export function isMemberGroupClientError(value: unknown): value is MemberGroupClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value &&
    "warning" in value
  );
}

export async function fetchMemberships(
  query: MembershipListQuery,
  signal?: AbortSignal,
): Promise<MembershipListResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: query.page,
    per_page: query.perPage,
    mem_group_id: query.memGroupId,
    member_id: query.memberId,
    group_id: query.groupId,
    branch_id: query.branchId,
    center_id: query.centerId,
    member_role: query.memberRole,
    is_active: query.isActive == null ? undefined : query.isActive ? 1 : 0,
    keyword: query.keyword,
  })) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const result = await parse<MembershipListResult>(
    await fetch(`${endpoints.bff.groupMemberMapping}?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    }),
  );
  return result.data;
}

export async function fetchMemberGroupCheck(memberId: number): Promise<MemberGroupCheck> {
  const result = await parse<MemberGroupCheck>(
    await fetch(`${endpoints.bff.groupMemberMapping}?action=check&member_id=${memberId}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }),
  );
  return { ...result.data, message: result.data.message || result.message };
}

export async function assignMembers(input: AssignInput): Promise<{ message: string; items: GroupMembership[] }> {
  const result = await parse<GroupMembership[]>(
    await fetch(endpoints.bff.groupMemberMapping, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign", ...input }),
    }),
  );
  return { message: result.message, items: result.data ?? [] };
}

export async function reassignMember(input: ReassignInput): Promise<{ message: string; result: ReassignResult }> {
  const result = await parse<ReassignResult>(
    await fetch(endpoints.bff.groupMemberMapping, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reassign", ...input }),
    }),
  );
  return { message: result.message, result: result.data };
}

export async function editMembership(
  input: EditMembershipInput,
): Promise<{ message: string; item: GroupMembership }> {
  const result = await parse<GroupMembership>(
    await fetch(endpoints.bff.groupMemberMapping, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", ...input }),
    }),
  );
  return { message: result.message, item: result.data };
}

export async function exitMember(input: ExitInput): Promise<{ message: string; item: GroupMembership }> {
  const result = await parse<GroupMembership>(
    await fetch(endpoints.bff.groupMemberMapping, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "exit", ...input }),
    }),
  );
  return { message: result.message, item: result.data };
}
