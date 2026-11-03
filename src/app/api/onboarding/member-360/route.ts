import { NextResponse } from "next/server";
import {
  getMember360,
  resolveMember360Id,
} from "@/features/onboarding/member-360/services/member-360.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";
import { readRecordCode } from "@/lib/navigation/record-code";

/** Laravel: GET /api/Member360Get. Accepts `member` (code) or `member_id`. */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const scope = { branchId: resolveBranchFilter(user, undefined) };
    const params = new URL(request.url).searchParams;

    const code = readRecordCode(params.get("member") ?? undefined);
    const rawId = Number(params.get("member_id"));
    let memberId: number;
    if (code) {
      memberId = await resolveMember360Id(code, scope);
    } else if (Number.isInteger(rawId) && rawId > 0) {
      memberId = rawId;
    } else {
      return NextResponse.json({ success: false, message: "A valid member is required" }, { status: 422 });
    }

    const data = await getMember360(memberId, scope);
    return NextResponse.json({ success: true, message: "Member retrieved", data });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
