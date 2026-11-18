import { NextResponse } from "next/server";
import { listMemberNominees } from "@/features/onboarding/member-registration/services/member.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

/** Laravel: GET /api/MemberNomineeList */
export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const memberId = Number(searchParams.get("member_id"));
    if (!Number.isInteger(memberId) || memberId <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid member is required" },
        { status: 422 },
      );
    }
    const items = await listMemberNominees(
      memberId,
      searchParams.get("include_inactive") === "1",
    );
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
