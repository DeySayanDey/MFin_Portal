import { NextResponse } from "next/server";
import {
  addDepositSignatories,
  changeDepositSignatoryStatus,
  editDepositSignatory,
  listDepositSignatories,
  listGroupMembers,
} from "@/features/deposits/savings/services/deposit-account.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const groupId = Number(searchParams.get("group_id"));
    if (Number.isInteger(groupId) && groupId > 0) {
      const data = await listGroupMembers(groupId);
      return NextResponse.json({
        success: true,
        message: "Group members retrieved successfully",
        data,
      });
    }

    const accountId = Number(searchParams.get("account_id"));
    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed" },
        { status: 422 },
      );
    }
    const data = await listDepositSignatories(accountId);
    return NextResponse.json({
      success: true,
      message: "Signatories retrieved successfully",
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
      await editDepositSignatory(payload);
      return NextResponse.json({
        success: true,
        message: "Signatory updated",
        data: null,
      });
    }

    if (action === "status") {
      await changeDepositSignatoryStatus(payload);
      return NextResponse.json({
        success: true,
        message: "Signatory status updated",
        data: null,
      });
    }

    await addDepositSignatories(payload);
    return NextResponse.json(
      { success: true, message: "Signatories added successfully", data: null },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
