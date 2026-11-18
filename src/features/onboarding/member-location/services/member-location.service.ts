import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import type {
  LocationAddInput,
  LocationEditInput,
  LocationGeoInput,
  LocationStatusInput,
  MemberLocation,
  MemberLocationListQuery,
  MemberLocationListResult,
} from "@/features/onboarding/member-location/types/member-location.types";

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

function mapLocation(row: Raw): MemberLocation {
  return {
    memberLocId: numberValue(row, "member_loc_id") ?? 0,
    memberId: numberValue(row, "member_id") ?? 0,
    memberCode: text(row, "member_code"),
    refCode: text(row, "ref_code"),
    memberName: text(row, "member_name") ?? "",
    mobileNo: text(row, "mobile_no"),
    memberStatusCd: numberValue(row, "member_status_cd"),
    memberStatusDesc: text(row, "member_status_desc"),
    branchId: numberValue(row, "branch_id"),
    branchName: text(row, "branch_name"),
    centerId: numberValue(row, "center_id"),
    centerName: text(row, "center_name"),
    addTypeCd: numberValue(row, "add_type_cd") ?? 0,
    addTypeDesc: text(row, "add_type_desc"),
    addressLine1: text(row, "address_line1") ?? "",
    addressLine2: text(row, "address_line2"),
    village: text(row, "village"),
    gramPanchayat: text(row, "gram_panchayat"),
    blockName: text(row, "block_name"),
    districtName: text(row, "district_name") ?? "",
    stateCd: numberValue(row, "state_cd") ?? 0,
    stateName: text(row, "state_name"),
    pinCode: text(row, "pin_code") ?? "",
    fullAddress: text(row, "full_address"),
    latitude: numberValue(row, "latitude"),
    longitude: numberValue(row, "longitude"),
    hasCoordinates: boolValue(row, "has_coordinates"),
    mapUrl: text(row, "map_url"),
    geoVerified: boolValue(row, "geo_verified"),
    geoVerifiedDate: text(row, "geo_verified_date"),
    geoVerifiedByName: text(row, "geo_verified_by_name"),
    photoPath: text(row, "photo_path"),
    isActive: boolValue(row, "is_active"),
  };
}

function draftBody(input: LocationEditInput | LocationAddInput["locations"][number], clear: boolean) {
  const body: Record<string, unknown> = {
    add_type_cd: input.addTypeCd,
    address_line1: input.addressLine1,
    district_name: input.districtName,
    state_cd: input.stateCd,
    pin_code: input.pinCode,
  };
  const optional: Record<string, unknown> = {
    address_line2: input.addressLine2 ?? null,
    village: input.village ?? null,
    gram_panchayat: input.gramPanchayat ?? null,
    block_name: input.blockName ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    photo_path: input.photoPath ?? null,
  };
  for (const [key, value] of Object.entries(optional)) {
    if (clear || value != null) body[key] = value;
  }
  return body;
}

async function token(): Promise<string> {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new ApiError({ message: "Unauthorized", status: 401, code: "UNAUTHORIZED" });
  return accessToken;
}

async function run<T>(work: (accessToken: string) => Promise<T>): Promise<T> {
  try {
    return await work(await token());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await clearAuthSession();
    throw error;
  }
}

function assertSuccess<T>(payload: LaravelResponse<T>): asserts payload is Extract<LaravelResponse<T>, { success: true }> {
  if (!payload.success) {
    throw new ApiError({ message: payload.message || "Request failed", status: 422, code: "VALIDATION" });
  }
}

export async function listMemberLocations(
  query: MemberLocationListQuery = {},
  signal?: AbortSignal,
): Promise<MemberLocationListResult> {
  return run(async (accessToken) => {
    const perPage = Math.min(200, Math.max(1, query.perPage ?? 50));
    const payload = await api.get<LaravelResponse<Raw[]>>(endpoints.memberLocation.list, {
      accessToken,
      expectEnvelope: false,
      signal,
      searchParams: {
        page: query.page ?? 1,
        per_page: perPage,
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
      },
    });
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const meta = payload.meta;
    return {
      items: rows.map(mapLocation),
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

export async function addMemberLocations(input: LocationAddInput): Promise<{ message: string; items: MemberLocation[] }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw[]>>(
      endpoints.memberLocation.add,
      { member_id: input.memberId, locations: input.locations.map((row) => draftBody(row, false)) },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    const rows = Array.isArray(payload.data) ? payload.data : [];
    return { message: payload.message, items: rows.map(mapLocation) };
  });
}

export async function editMemberLocation(input: LocationEditInput): Promise<{ message: string; item: MemberLocation }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw>>(
      endpoints.memberLocation.edit,
      { member_loc_id: input.memberLocId, ...draftBody(input, true) },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message, item: mapLocation(payload.data ?? {}) };
  });
}

export async function geoVerifyMemberLocation(input: LocationGeoInput): Promise<{ message: string; item: MemberLocation }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw>>(
      endpoints.memberLocation.geoVerify,
      {
        member_loc_id: input.memberLocId,
        geo_verified: input.geoVerified,
        latitude: input.latitude,
        longitude: input.longitude,
      },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message, item: mapLocation(payload.data ?? {}) };
  });
}

export async function changeMemberLocationStatus(
  input: LocationStatusInput,
): Promise<{ message: string; item: MemberLocation }> {
  return run(async (accessToken) => {
    const payload = await api.post<LaravelResponse<Raw>>(
      endpoints.memberLocation.status,
      { member_loc_id: input.memberLocId, is_active: input.isActive },
      { accessToken, expectEnvelope: false },
    );
    assertSuccess(payload);
    return { message: payload.message, item: mapLocation(payload.data ?? {}) };
  });
}
