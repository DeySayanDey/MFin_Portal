import { NextResponse } from "next/server";
import { listMembers } from "@/features/onboarding/member-registration/services/member.service";
import { ApiError } from "@/lib/api/errors";
import {
  memberLedgerBranchScope,
  memberLedgerTxnQuery,
} from "@/features/deposits/member-ledger/member-ledger-query";
import { getMemberLedgerTransactions } from "@/features/deposits/member-ledger/services/member-ledger.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

/** Laravel: GET /api/MemberLedgerTermTransactions */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const query = memberLedgerTxnQuery(request);
    const members = await listMembers({ memberId: query.memberId, branchId: memberLedgerBranchScope(user), page: 1, perPage: 1 });
    if (!members.items.some((member) => member.memberId === query.memberId)) {
      throw new ApiError({ message: "Forbidden", status: 403, code: "FORBIDDEN" });
    }
    const result = await getMemberLedgerTransactions({ ...query, section: "term" });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
