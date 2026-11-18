import { NextResponse } from "next/server";
import {
  createMakerCheckerRule,
  listMakerCheckerRules,
  updateMakerCheckerRule,
} from "@/features/master/maker-checker/services/maker-checker.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const perPage = searchParams.get("per_page");
    const id = searchParams.get("id");
    const voucherType = searchParams.get("voucher_type");
    const isActive =
      searchParams.get("is_active") ?? searchParams.get("status");

    const result = await listMakerCheckerRules({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      id: id ? Number(id) : undefined,
      voucherType: voucherType ? Number(voucherType) : undefined,
      isActive:
        isActive != null && isActive !== "" ? Number(isActive) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Maker-checker rules retrieved successfully",
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
      const result = await updateMakerCheckerRule(rest);
      return NextResponse.json({
        success: true,
        message: "Maker-checker rule updated successfully",
        data: result,
      });
    }

    const { action: _a, ...rest } = body;
    const result = await createMakerCheckerRule(rest);
    return NextResponse.json(
      {
        success: true,
        message: "Maker-checker rule created successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
