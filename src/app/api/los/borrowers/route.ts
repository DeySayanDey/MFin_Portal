import { NextResponse } from "next/server";
import { lookupLoanBorrowers } from "@/features/los/services/los.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readOptionalText(raw: string | null): string | undefined {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const search =
      readOptionalText(searchParams.get("search")) ??
      readOptionalText(searchParams.get("keyword"));

    const eligibleOnlyRaw = searchParams.get("eligible_only");
    const eligibleOnly =
      eligibleOnlyRaw === "1" || eligibleOnlyRaw === "true"
        ? true
        : eligibleOnlyRaw === "0" || eligibleOnlyRaw === "false"
          ? false
          : undefined;

    const result = await lookupLoanBorrowers({
      keyword: search,
      branch_id: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      group_id: readOptionalNumber(searchParams.get("group_id")),
      center_id: readOptionalNumber(searchParams.get("center_id")),
      cust_type_cd: readOptionalNumber(searchParams.get("cust_type_cd")),
      eligible_only: eligibleOnly,
      page: readOptionalNumber(searchParams.get("page")),
      per_page: readOptionalNumber(searchParams.get("per_page")),
    });

    return NextResponse.json({
      success: true,
      message: "Borrowers retrieved successfully",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
