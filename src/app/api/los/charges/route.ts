import { NextResponse } from "next/server";
import {
  addLoanApplicationCharge,
  changeLoanApplicationChargeStatus,
  editLoanApplicationCharge,
  listLoanApplicationCharges,
} from "@/features/los/services/los.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const applicationId = Number(searchParams.get("application_id"));
    if (!Number.isFinite(applicationId) || applicationId <= 0) {
      return NextResponse.json(
        { success: false, message: "application_id is required", data: [] },
        { status: 422 },
      );
    }
    const charges = await listLoanApplicationCharges(applicationId);
    return NextResponse.json({
      success: true,
      message: "Charges retrieved successfully",
      data: charges,
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
    delete body.action;

    if (action === "edit") {
      const charge = await editLoanApplicationCharge(body as any);
      return NextResponse.json({
        success: true,
        message: "Charge updated successfully",
        data: charge,
      });
    }

    if (action === "status") {
      const charge = await changeLoanApplicationChargeStatus(body as any);
      return NextResponse.json({
        success: true,
        message: "Charge status updated successfully",
        data: charge,
      });
    }

    const charge = await addLoanApplicationCharge(body as any);
    return NextResponse.json(
      {
        success: true,
        message: "Charge added successfully",
        data: charge,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
