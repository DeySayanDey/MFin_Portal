import { endpoints } from "@/lib/api/endpoints";
import type {
  Group,
  GroupListQuery,
  GroupListResult,
  GroupSaveInput,
  GroupStatus,
  GroupTabCounts,
} from "@/features/onboarding/group-management/types/group.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T; meta?: GroupListResult["meta"] };

export type GroupClientError = { status: number; message: string; details?: unknown };

async function parse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T> & { errors?: unknown };
  if (!response.ok || payload.success === false) {
    throw {
      status: response.status || 500,
      message: payload.message || "Group request failed",
      details: payload.errors,
    } satisfies GroupClientError;
  }
  return payload.data as T;
}

export function isGroupClientError(value: unknown): value is GroupClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

export async function fetchGroups(query: GroupListQuery): Promise<GroupListResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: query.page,
    per_page: query.perPage,
    group_id: query.groupId,
    keyword: query.keyword,
    branch_id: query.branchId,
    center_id: query.centerId,
    fo_id: query.foId,
    group_type_cd: query.groupTypeCd,
    status_cd: query.statusCd,
  })) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  return parse<GroupListResult>(
    await fetch(`${endpoints.bff.groupManagement}?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }),
  );
}

export async function fetchGroupById(groupId: number): Promise<Group | null> {
  const result = await fetchGroups({ groupId, perPage: 1 });
  return result.items[0] ?? null;
}

export async function fetchGroupTabCounts(
  filters: Omit<GroupListQuery, "statusCd" | "page" | "perPage"> = {},
): Promise<GroupTabCounts> {
  const [allRes, activeRes, inactiveRes, suspendedRes, closedRes] = await Promise.all([
    fetchGroups({ ...filters, perPage: 1 }),
    fetchGroups({ ...filters, statusCd: 1, perPage: 1 }),
    fetchGroups({ ...filters, statusCd: 2, perPage: 1 }),
    fetchGroups({ ...filters, statusCd: 3, perPage: 1 }),
    fetchGroups({ ...filters, statusCd: 4, perPage: 1 }),
  ]);
  return {
    all: allRes.meta?.total ?? allRes.items.length,
    active: activeRes.meta?.total ?? activeRes.items.length,
    inactive: inactiveRes.meta?.total ?? inactiveRes.items.length,
    suspended: suspendedRes.meta?.total ?? suspendedRes.items.length,
    closed: closedRes.meta?.total ?? closedRes.items.length,
  };
}

export async function saveGroup(input: GroupSaveInput): Promise<Group | null> {
  return parse<Group | null>(
    await fetch(endpoints.bff.groupManagement, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", ...input }),
    }),
  );
}

export async function updateGroupStatus(groupId: number, statusCd: GroupStatus): Promise<Group | null> {
  return parse<Group | null>(
    await fetch(endpoints.bff.groupManagement, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", group_id: groupId, status_cd: statusCd }),
    }),
  );
}
