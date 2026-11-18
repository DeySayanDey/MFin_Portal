import { NextResponse } from "next/server";
import {
  addDepositNominees,
  changeDepositNomineeStatus,
  editDepositNominee,
  listDepositNominees,
} from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const accountId = Number(new URL(request.url).searchParams.get("account_id"));
    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed" },
        { status: 422 },
      );
    }
    const data = await listDepositNominees(accountId);
    return NextResponse.json({
      success: true,
      message: "Nominees retrieved successfully",
      data,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    const payload = { ...body };
    delete payload.action;

    if (action === "edit") {
      await editDepositNominee(payload);
      return NextResponse.json({
        success: true,
        message: "Nominee updated",
        data: null,
      });
    }

    if (action === "status") {
      await changeDepositNomineeStatus(payload);
      return NextResponse.json({
        success: true,
        message: "Nominee status updated",
        data: null,
      });
    }

    await addDepositNominees(payload);
    return NextResponse.json(
      { success: true, message: "Nominees added successfully", data: null },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
