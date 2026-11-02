import { NextResponse } from "next/server";
import { getMemberLedger } from "@/features/deposits/member-ledger/services/member-ledger.service";
import { listMembers } from "@/features/onboarding/member-registration/services/member.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ApiError } from "@/lib/api/errors";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

async function assertMember(memberId: number) {
  const user = await requireSessionUser();
  const result = await listMembers({
    memberId,
    branchId: resolveBranchFilter(user, undefined),
    page: 1,
    perPage: 1,
  });
  if (!result.items.some((member) => member.memberId === memberId)) {
    throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
  }
}

/** Laravel: GET /api/MemberLedger */
export async function GET(request: Request) {
  try {
    const memberId = Number(new URL(request.url).searchParams.get("member_id"));
    if (!Number.isInteger(memberId) || memberId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid member is required" },
        { status: 422 },
      );
    }
    await assertMember(memberId);
    const includeClosed = new URL(request.url).searchParams.get("include_closed") !== "0";
    const data = await getMemberLedger(memberId, includeClosed);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
