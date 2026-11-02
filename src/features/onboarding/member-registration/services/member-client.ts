import { endpoints } from "@/lib/api/endpoints";
import { dedupeRequest } from "@/lib/client/request-dedupe";
import type {
  Member,
  MemberListQuery,
  MemberListResult,
  MemberNomineeRecord,
  MemberSaveInput,
  MemberStatus,
  MemberTabCounts,
} from "@/features/onboarding/member-registration/types/member.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T; meta?: MemberListResult["meta"] };

export type MemberClientError = { status: number; message: string; details?: unknown };

async function parse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T> & { errors?: unknown };
  if (!response.ok || payload.success === false) {
    throw {
      status: response.status || 500,
      message: payload.message || "Member request failed",
      details: payload.errors,
    } satisfies MemberClientError;
  }
  return payload.data as T;
}

export function isMemberClientError(value: unknown): value is MemberClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

let directoryAbort: AbortController | null = null;

export async function fetchMembers(
  query: MemberListQuery,
  options?: { generation?: number; replace?: boolean },
): Promise<MemberListResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: query.page,
    per_page: query.perPage,
    member_id: query.memberId,
    keyword: query.keyword,
    branch_id: query.branchId,
    center_id: query.centerId,
    group_id: query.groupId,
    fo_id: query.foId,
    gender_cd: query.genderCd,
    status_cd: query.statusCd,
  })) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const key = `${params.toString()}#${options?.generation ?? 0}`;
  return dedupeRequest(key, async () => {
    const controller = new AbortController();
    if (options?.replace) {
      directoryAbort?.abort();
      directoryAbort = controller;
    }
    return parse<MemberListResult>(
      await fetch(`${endpoints.bff.memberRegistration}?${params}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      }),
    );
  }, 0);
}

export async function fetchMemberNominees(
  memberId: number,
  includeInactive = false,
): Promise<MemberNomineeRecord[]> {
  const params = new URLSearchParams({ member_id: String(memberId) });
  if (includeInactive) params.set("include_inactive", "1");
  return parse<MemberNomineeRecord[]>(
    await fetch(`${endpoints.bff.memberNominees}?${params.toString()}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }),
  );
}

export async function fetchMemberById(memberId: number): Promise<Member | null> {
  const result = await fetchMembers({ memberId, perPage: 1 });
  return result.items[0] ?? null;
}

export async function fetchMemberTabCounts(
  filters: Omit<MemberListQuery, "statusCd" | "page" | "perPage"> = {},
): Promise<MemberTabCounts> {
  const [allRes, activeRes, inactiveRes, suspendedRes, closedRes, deathRes] = await Promise.all([
    fetchMembers({ ...filters, perPage: 1 }),
    fetchMembers({ ...filters, statusCd: 1, perPage: 1 }),
    fetchMembers({ ...filters, statusCd: 2, perPage: 1 }),
    fetchMembers({ ...filters, statusCd: 3, perPage: 1 }),
    fetchMembers({ ...filters, statusCd: 4, perPage: 1 }),
    fetchMembers({ ...filters, statusCd: 5, perPage: 1 }),
  ]);
  return {
    all: allRes.meta?.total ?? allRes.items.length,
    active: activeRes.meta?.total ?? activeRes.items.length,
    inactive: inactiveRes.meta?.total ?? inactiveRes.items.length,
    suspended: suspendedRes.meta?.total ?? suspendedRes.items.length,
    closed: closedRes.meta?.total ?? closedRes.items.length,
    death: deathRes.meta?.total ?? deathRes.items.length,
  };
}

export async function saveMember(input: MemberSaveInput): Promise<Member | null> {
  return parse<Member | null>(
    await fetch(endpoints.bff.memberRegistration, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", ...input }),
    }),
  );
}

export async function updateMemberStatus(memberId: number, statusCd: MemberStatus): Promise<Member | null> {
  return parse<Member | null>(
    await fetch(endpoints.bff.memberRegistration, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", member_id: memberId, status_cd: statusCd }),
    }),
  );
}
