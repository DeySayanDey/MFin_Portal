import { resolveBranchFilter as scopedBranch } from "@/lib/auth/bff-scope";
import { NextResponse } from "next/server";
import { listGroups } from "@/features/onboarding/group-management/services/group.service";
import {
  assignMembers,
  checkMemberGroup,
  editMembership,
  exitMember,
  listMemberships,
  reassignMember,
} from "@/features/onboarding/group-member-mapping/services/member-group.service";
import type { MemberRole } from "@/features/onboarding/group-member-mapping/types/member-group.types";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError, isApiError } from "@/lib/api/errors";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

const ROLES = new Set(["Member", "President", "Secretary", "Treasurer"]);

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function roleOf(value: unknown): MemberRole | undefined {
  if (typeof value !== "string") return undefined;
  const match = [...ROLES].find((role) => role.toLowerCase() === value.trim().toLowerCase());
  return match as MemberRole | undefined;
}

function loanWarning(error: unknown): NextResponse | null {
  if (!isApiError(error) || error.status !== 409) return null;
  return NextResponse.json(
    {
      success: false,
      warning: true,
      message: error.message.slice(0, 300),
      data: null,
    },
    { status: 409 },
  );
}

async function assertGroupBranch(groupId: number, branchId: number | undefined) {
  const result = await listGroups({ groupId, branchId, perPage: 1, page: 1 });
  if (!result.items.some((group) => group.groupId === groupId)) {
    throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const branchId = resolveBranchFilter(user, optionalNumber(params.get("branch_id")));

    if (params.get("action") === "check") {
      const memberId = optionalNumber(params.get("member_id"));
      if (!memberId) {
        throw new ApiError({ message: "member_id is required", status: 422, code: "VALIDATION" });
      }
      const check = await checkMemberGroup(memberId);
      if (!user.isHead && !user.isAdmin && check.groupId) {
        const rows = await listMemberships({
          memberId,
          groupId: check.groupId,
          isActive: true,
          perPage: 1,
          branchId: scopedBranch(user, undefined),
        });
        if (rows.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      return NextResponse.json({ success: true, message: check.message, data: check });
    }

    const active = params.get("is_active");
    const result = await listMemberships({
      page: optionalNumber(params.get("page")),
      perPage: optionalNumber(params.get("per_page")),
      memGroupId: optionalNumber(params.get("mem_group_id")),
      memberId: optionalNumber(params.get("member_id")),
      groupId: optionalNumber(params.get("group_id")),
      branchId,
      centerId: optionalNumber(params.get("center_id")),
      memberRole: params.get("member_role")?.trim() || undefined,
      isActive: active == null || active === "" ? undefined : active === "1" || active === "true",
      keyword: params.get("keyword")?.trim() || undefined,
    });
    return NextResponse.json({
      success: true,
      message: "Group members retrieved successfully",
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

    if (action === "assign") {
      const groupId = optionalNumber(body.groupId);
      const members = Array.isArray(body.members) ? body.members : [];
      if (!groupId || members.length === 0) {
        throw new ApiError({ message: "Group and members are required", status: 422, code: "VALIDATION" });
      }
      await assertGroupBranch(groupId, branchId);
      const saved = await assignMembers({
        groupId,
        joinDate: typeof body.joinDate === "string" ? body.joinDate : undefined,
        members: members.slice(0, 20).map((item) => {
          const row = item as Record<string, unknown>;
          return {
            memberId: optionalNumber(row.memberId) ?? 0,
            memberRole: roleOf(row.memberRole),
          };
        }),
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.items }, { status: 201 });
    }

    if (action === "reassign") {
      const memberId = optionalNumber(body.memberId);
      const groupId = optionalNumber(body.groupId);
      if (!memberId || !groupId) {
        throw new ApiError({ message: "Member and group are required", status: 422, code: "VALIDATION" });
      }
      await assertGroupBranch(groupId, branchId);
      const saved = await reassignMember({
        memberId,
        groupId,
        memberRole: roleOf(body.memberRole),
        transferDate: typeof body.transferDate === "string" ? body.transferDate : undefined,
        reason: typeof body.reason === "string" ? body.reason : undefined,
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.result });
    }

    if (action === "edit") {
      const memGroupId = optionalNumber(body.memGroupId);
      if (!memGroupId) {
        throw new ApiError({ message: "Membership is required", status: 422, code: "VALIDATION" });
      }
      if (branchId != null) {
        const current = await listMemberships({ memGroupId, branchId, perPage: 1 });
        if (current.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      const input: Parameters<typeof editMembership>[0] = { memGroupId };
      if ("memberRole" in body) input.memberRole = roleOf(body.memberRole) ?? null;
      if ("foId" in body) input.foId = body.foId == null || body.foId === "" ? null : optionalNumber(body.foId) ?? null;
      if (typeof body.joinDate === "string" && body.joinDate) input.joinDate = body.joinDate;
      const saved = await editMembership(input);
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    if (action === "exit") {
      const memberId = optionalNumber(body.memberId);
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (!memberId || !reason) {
        throw new ApiError({ message: "Member and exit reason are required", status: 422, code: "VALIDATION" });
      }
      if (branchId != null) {
        const current = await listMemberships({ memberId, isActive: true, branchId, perPage: 1 });
        if (current.items.length === 0) {
          throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
        }
      }
      const saved = await exitMember({
        memberId,
        reason,
        exitDate: typeof body.exitDate === "string" ? body.exitDate : undefined,
      });
      return NextResponse.json({ success: true, message: saved.message, data: saved.item });
    }

    throw new ApiError({ message: "Unknown action", status: 422, code: "VALIDATION" });
  } catch (error) {
    return loanWarning(error) ?? toBffErrorResponse(error);
  }
}
