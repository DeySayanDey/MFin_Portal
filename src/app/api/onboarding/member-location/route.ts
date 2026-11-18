import { resolveBranchFilter as scopedBranch } from "@/lib/auth/bff-scope";
import { NextResponse } from "next/server";
import { listMembers } from "@/features/onboarding/member-registration/services/member.service";
import {
  addMemberLocations,
  changeMemberLocationStatus,
  editMemberLocation,
  geoVerifyMemberLocation,
  listMemberLocations,
} from "@/features/onboarding/member-location/services/member-location.service";
import type { LocationDraftInput } from "@/features/onboarding/member-location/types/member-location.types";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalText(value: unknown, max = 200): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed.slice(0, max);
}

function optionalCoord(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readDraft(row: Record<string, unknown>): LocationDraftInput {
  return {
    addTypeCd: optionalNumber(row.addTypeCd) ?? 0,
    addressLine1: optionalText(row.addressLine1, 200) ?? "",
    addressLine2: optionalText(row.addressLine2, 200),
    village: optionalText(row.village, 100),
    gramPanchayat: optionalText(row.gramPanchayat, 100),
    blockName: optionalText(row.blockName, 100),
    districtName: optionalText(row.districtName, 100) ?? "",
    stateCd: optionalNumber(row.stateCd) ?? 0,
    pinCode: optionalText(row.pinCode, 12) ?? "",
    latitude: optionalCoord(row.latitude),
    longitude: optionalCoord(row.longitude),
    photoPath: optionalText(row.photoPath, 300),
  };
}

async function assertMemberBranch(memberId: number, branchId: number | undefined) {
  if (branchId == null) return;
  const result = await listMembers({ memberId, branchId, perPage: 1, page: 1 });
  if (!result.items.some((member) => member.memberId === memberId)) {
    throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const branchId = resolveBranchFilter(user, optionalNumber(params.get("branch_id")));
    const active = params.get("is_active");
    const geo = params.get("geo_verified");
    const coords = params.get("has_coordinates");
    const flag = (value: string | null) =>
      value == null || value === "" ? undefined : value === "1" || value === "true";
    const result = await listMemberLocations(
      {
        page: optionalNumber(params.get("page")),
        perPage: optionalNumber(params.get("per_page")),
        memberLocId: optionalNumber(params.get("member_loc_id")),
        memberId: optionalNumber(params.get("member_id")),
        branchId,
        centerId: optionalNumber(params.get("center_id")),
        addTypeCd: optionalNumber(params.get("add_type_cd")),
        stateCd: optionalNumber(params.get("state_cd")),
        geoVerified: flag(geo),
        hasCoordinates: flag(coords),
        isActive: flag(active),
        keyword: params.get("keyword")?.trim() || undefined,
      },
      request.signal,
    );
    return NextResponse.json({
      success: true,
      message: "Member locations retrieved successfully",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const branchId = scopedBranch(user, undefined);

    if (action === "add") {
      const memberId = optionalNumber(body.memberId);
      const locations = Array.isArray(body.locations) ? body.locations : [];
      if (!memberId || locations.length === 0 || locations.length > 5) {
        throw new ApiError({ message: "Member and 1 to 5 addresses are required", status: 422, code: "VALIDATION" });
      }
      await assertMemberBranch(memberId, branchId);
      const saved = await addMemberLocations({
        memberId,
        locations: locations.map((item) => readDraft(item as Record<string, unknown>)),
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.items }, { status: 201 });
    }

    if (action === "edit") {
      const memberLocId = optionalNumber(body.memberLocId);
      if (!memberLocId) {
        throw new ApiError({ message: "Address is required", status: 422, code: "VALIDATION" });
      }
      if (branchId != null) {
        const current = await listMemberLocations({ memberLocId, branchId, perPage: 1 });
        if (current.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      const saved = await editMemberLocation({ memberLocId, ...readDraft(body) });
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    if (action === "geo") {
      const memberLocId = optionalNumber(body.memberLocId);
      if (!memberLocId || typeof body.geoVerified !== "boolean") {
        throw new ApiError({ message: "Address and verification are required", status: 422, code: "VALIDATION" });
      }
      if (branchId != null) {
        const current = await listMemberLocations({ memberLocId, branchId, perPage: 1 });
        if (current.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      const saved = await geoVerifyMemberLocation({
        memberLocId,
        geoVerified: body.geoVerified,
        latitude: optionalCoord(body.latitude) ?? undefined,
        longitude: optionalCoord(body.longitude) ?? undefined,
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    if (action === "status") {
      const memberLocId = optionalNumber(body.memberLocId);
      if (!memberLocId || typeof body.isActive !== "boolean") {
        throw new ApiError({ message: "Address and status are required", status: 422, code: "VALIDATION" });
      }
      if (branchId != null) {
        const current = await listMemberLocations({ memberLocId, branchId, perPage: 1 });
        if (current.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      const saved = await changeMemberLocationStatus({ memberLocId, isActive: body.isActive });
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    throw new ApiError({ message: "Unknown action", status: 422, code: "VALIDATION" });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
