import { NextResponse } from "next/server";
import { approveDisbursement } from "@/features/lms/disbursement/services/disbursement.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;

    const disbursementId = Number(body.disbursement_id);
    if (!disbursementId) {
      return NextResponse.json(
        { success: false, message: "disbursement_id is required" },
        { status: 422 },
      );
    }

    const approve = body.approve !== false;
    const remarks = typeof body.remarks === "string" ? body.remarks.trim() : "";

    if (!approve && !remarks) {
      return NextResponse.json(
        { success: false, message: "Remarks are required to reject a disbursement" },
        { status: 422 },
      );
    }

    const result = await approveDisbursement({
      disbursement_id: disbursementId,
      approve,
      remarks: remarks || undefined,
    });

    return NextResponse.json({
      success: true,
      message: approve ? "Disbursement approved successfully" : "Disbursement rejected",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
