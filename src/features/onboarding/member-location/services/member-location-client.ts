import { endpoints } from "@/lib/api/endpoints";
import type {
  LocationAddInput,
  LocationEditInput,
  LocationGeoInput,
  LocationStatusInput,
  MemberLocation,
  MemberLocationListQuery,
  MemberLocationListResult,
} from "@/features/onboarding/member-location/types/member-location.types";

type Envelope<T> = { success?: boolean; message?: string; data?: T };

export type MemberLocationClientError = { status: number; message: string };

async function parse<T>(response: Response): Promise<{ message: string; data: T }> {
  const payload = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || payload.success === false) {
    throw {
      status: response.status || 500,
      message: payload.message || "Location request failed",
    } satisfies MemberLocationClientError;
  }
  return { message: payload.message ?? "", data: payload.data as T };
}

export function isMemberLocationClientError(value: unknown): value is MemberLocationClientError {
  return typeof value === "object" && value !== null && "status" in value && "message" in value;
}

export async function fetchMemberLocations(
  query: MemberLocationListQuery,
  signal?: AbortSignal,
): Promise<MemberLocationListResult> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    page: query.page,
    per_page: query.perPage,
    member_loc_id: query.memberLocId,
    member_id: query.memberId,
    branch_id: query.branchId,
    center_id: query.centerId,
    add_type_cd: query.addTypeCd,
    state_cd: query.stateCd,
    geo_verified: query.geoVerified == null ? undefined : query.geoVerified ? 1 : 0,
    has_coordinates: query.hasCoordinates == null ? undefined : query.hasCoordinates ? 1 : 0,
    is_active: query.isActive == null ? undefined : query.isActive ? 1 : 0,
    keyword: query.keyword,
  })) {
    if (value != null && value !== "") params.set(key, String(value));
  }
  const result = await parse<MemberLocationListResult>(
    await fetch(`${endpoints.bff.memberLocation}?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    }),
  );
  return result.data;
}

async function post<T>(action: string, body: unknown): Promise<{ message: string; data: T }> {
  return parse<T>(
    await fetch(endpoints.bff.memberLocation, {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(body as object) }),
    }),
  );
}

export async function addMemberLocations(input: LocationAddInput) {
  const result = await post<MemberLocation[]>("add", input);
  return { message: result.message, items: result.data ?? [] };
}

export async function editMemberLocation(input: LocationEditInput) {
  const result = await post<MemberLocation>("edit", input);
  return { message: result.message, item: result.data };
}

export async function geoVerifyMemberLocation(input: LocationGeoInput) {
  const result = await post<MemberLocation>("geo", input);
  return { message: result.message, item: result.data };
}

export async function changeMemberLocationStatus(input: LocationStatusInput) {
  const result = await post<MemberLocation>("status", input);
  return { message: result.message, item: result.data };
}
