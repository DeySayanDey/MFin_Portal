import { NextResponse } from "next/server";
import {
  memberLedgerBranchScope,
  memberLedgerTxnQuery,
} from "@/features/deposits/member-ledger/member-ledger-query";
import { getMemberLedgerTransactions } from "@/features/deposits/member-ledger/services/member-ledger.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

/** Laravel: GET /api/MemberLedgerSavingsTransactions */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const result = await getMemberLedgerTransactions(
      "savings",
      memberLedgerTxnQuery(request),
      memberLedgerBranchScope(user),
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
