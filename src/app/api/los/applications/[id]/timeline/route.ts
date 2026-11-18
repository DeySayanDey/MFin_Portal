import { NextResponse } from "next/server";
import { getLoanApplicationTimeline } from "@/features/los/services/los.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSessionUser();
    const { id } = await params;
    const applicationId = Number(id);
    if (!Number.isFinite(applicationId) || applicationId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid application ID", data: null },
        { status: 400 },
      );
    }

    const events = await getLoanApplicationTimeline(applicationId);
    return NextResponse.json({
      success: true,
      message: "Application timeline retrieved successfully",
      data: events,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
