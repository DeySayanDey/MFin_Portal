import { NextResponse } from "next/server";
import {
  createAcctSubledger,
  listAcctSubledgers,
  updateAcctSubledger,
} from "@/features/master/acct-subledger/services/acct-subledger.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

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
    await requireSessionUser();
    const { searchParams } = new URL(request.url);

    const keyword =
      readOptionalText(searchParams.get("keyword")) ??
      readOptionalText(searchParams.get("search"));

    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listAcctSubledgers({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      subledgId: readOptionalNumber(searchParams.get("subledg_id")),
      ledgerId: readOptionalNumber(searchParams.get("ledger_id")),
      keyword,
      isActive: readOptionalNumber(isActiveRaw),
    });

    return NextResponse.json({
      success: true,
      message: "Account subledgers retrieved successfully",
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
      const item = await updateAcctSubledger(rest);
      return NextResponse.json({
        success: true,
        message: "Account subledger updated successfully",
        data: item,
      });
    }

    const { action: _a, ...rest } = body;
    const item = await createAcctSubledger(rest);
    return NextResponse.json(
      {
        success: true,
        message: "Account subledger created successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
