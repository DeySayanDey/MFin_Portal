import { NextResponse } from "next/server";
import {
  addLoanApplicationGuarantor,
  editLoanApplicationGuarantor,
  listLoanApplicationGuarantors,
  releaseLoanApplicationGuarantor,
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
    const guarantors = await listLoanApplicationGuarantors(applicationId);
    return NextResponse.json({
      success: true,
      message: "Guarantors retrieved successfully",
      data: guarantors,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const action = formData.get("action");
      formData.delete("action");

      if (action === "edit") {
        const item = await editLoanApplicationGuarantor(formData);
        return NextResponse.json({
          success: true,
          message: "Guarantor updated successfully",
          data: item,
        });
      }

      const item = await addLoanApplicationGuarantor(formData);
      return NextResponse.json(
        {
          success: true,
          message: "Guarantor added successfully",
          data: item,
        },
        { status: 201 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    delete body.action;

    if (action === "status" || action === "release") {
      const item = await releaseLoanApplicationGuarantor(body as any);
      return NextResponse.json({
        success: true,
        message: "Guarantor released successfully",
        data: item,
      });
    }

    if (action === "edit") {
      const item = await editLoanApplicationGuarantor(body);
      return NextResponse.json({
        success: true,
        message: "Guarantor updated successfully",
        data: item,
      });
    }

    const item = await addLoanApplicationGuarantor(body);
    return NextResponse.json(
      {
        success: true,
        message: "Guarantor added successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
