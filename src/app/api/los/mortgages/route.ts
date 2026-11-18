import { NextResponse } from "next/server";
import {
  addLoanApplicationMortgage,
  editLoanApplicationMortgage,
  listLoanApplicationMortgages,
  releaseLoanApplicationMortgage,
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
    const mortgages = await listLoanApplicationMortgages(applicationId);
    return NextResponse.json({
      success: true,
      message: "Mortgages retrieved successfully",
      data: mortgages,
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

    if (action === "status" || action === "release") {
      const item = await releaseLoanApplicationMortgage(body as any);
      return NextResponse.json({
        success: true,
        message: "Mortgage released successfully",
        data: item,
      });
    }

    if (action === "edit") {
      const item = await editLoanApplicationMortgage(body as any);
      return NextResponse.json({
        success: true,
        message: "Mortgage updated successfully",
        data: item,
      });
    }

    const item = await addLoanApplicationMortgage(body as any);
    return NextResponse.json(
      {
        success: true,
        message: "Mortgage added successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
