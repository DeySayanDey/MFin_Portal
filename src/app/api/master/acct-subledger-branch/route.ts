import { NextResponse } from "next/server";
import {
  createAcctSubledgerBranch,
  listAcctSubledgerBranches,
  updateAcctSubledgerBranch,
} from "@/features/master/acct-subledger-branch/services/acct-subledger-branch.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);

    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listAcctSubledgerBranches({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      id: readOptionalNumber(searchParams.get("id")),
      subledgId: readOptionalNumber(searchParams.get("subledg_id")),
      branchId: readOptionalNumber(searchParams.get("branch_id")),
      isActive: readOptionalNumber(isActiveRaw),
    });

    return NextResponse.json({
      success: true,
      message: "Subledger branch mappings retrieved successfully",
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
    assertHeadOffice(user);
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action === "update" ? "update" : "create";

    if (action === "update") {
      const { action: _a, ...rest } = body;
      const item = await updateAcctSubledgerBranch(rest);
      return NextResponse.json({
        success: true,
        message: "Subledger branch mapping updated successfully",
        data: item,
      });
    }

    const { action: _a, ...rest } = body;
    const item = await createAcctSubledgerBranch(rest);
    return NextResponse.json(
      {
        success: true,
        message: "Subledger branch mapping created successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
