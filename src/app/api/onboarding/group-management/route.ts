import { NextResponse } from "next/server";
import {
  changeGroupStatus,
  listGroups,
  saveGroup,
} from "@/features/onboarding/group-management/services/group.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";
import type { GroupListQuery, GroupSaveInput, GroupStatus } from "@/features/onboarding/group-management/types/group.types";

function optionalNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const requestedBranch = optionalNumber(params.get("branch_id"));
    const query: GroupListQuery = {
      page: optionalNumber(params.get("page")),
      perPage: optionalNumber(params.get("per_page")),
      groupId: optionalNumber(params.get("group_id")),
      keyword: params.get("keyword")?.trim() || undefined,
      branchId: resolveBranchFilter(user, requestedBranch),
      centerId: optionalNumber(params.get("center_id")),
      foId: optionalNumber(params.get("fo_id")),
      groupTypeCd: optionalNumber(params.get("group_type_cd")),
      statusCd: optionalNumber(params.get("status_cd")) as GroupStatus | undefined,
    };
    const result = await listGroups(query);
    return NextResponse.json({
      success: true,
      message: "Groups retrieved successfully",
      data: result,
      meta: result.meta,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown> & {
      action?: "status" | "save";
    };
    if (body.action === "status") {
      const groupId = Number(body.group_id);
      const statusCd = Number(body.status_cd) as GroupStatus;
      if (!Number.isFinite(groupId) || ![1, 2, 3, 4].includes(statusCd)) {
        return NextResponse.json({ success: false, message: "Invalid group status request" }, { status: 422 });
      }
      const result = await changeGroupStatus(groupId, statusCd);
      return NextResponse.json({ success: true, message: "Group status updated successfully", data: result });
    }

    const input = { ...body };
    delete input.action;
    if (typeof input.group_id === "number") {
      input.groupId = input.group_id;
      delete input.group_id;
    }
    if (typeof input.Group_Id === "number") {
      input.groupId = input.Group_Id;
      delete input.Group_Id;
    }
    if (input.president_member_id !== undefined && input.presidentMemberId === undefined) {
      input.presidentMemberId = input.president_member_id;
    }
    if (input.President_Member_Id !== undefined && input.presidentMemberId === undefined) {
      input.presidentMemberId = input.President_Member_Id;
    }
    if (input.secretary_member_id !== undefined && input.secretaryMemberId === undefined) {
      input.secretaryMemberId = input.secretary_member_id;
    }
    if (input.Secretary_Member_Id !== undefined && input.secretaryMemberId === undefined) {
      input.secretaryMemberId = input.Secretary_Member_Id;
    }
    if (input.treasurer_member_id !== undefined && input.treasurerMemberId === undefined) {
      input.treasurerMemberId = input.treasurer_member_id;
    }
    if (input.Treasurer_Member_Id !== undefined && input.treasurerMemberId === undefined) {
      input.treasurerMemberId = input.Treasurer_Member_Id;
    }
    if (!user.isHead && !user.isAdmin) input.branchId = resolveBranchFilter(user, undefined);
    const result = await saveGroup(input as unknown as GroupSaveInput);
    return NextResponse.json({ success: true, message: "Group saved successfully", data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
