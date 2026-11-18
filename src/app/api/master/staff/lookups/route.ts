import { NextResponse } from "next/server";
import { getStaffLookups } from "@/features/master/staff/services/staff.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET() {
  try {
    await requireSessionUser();
    const data = await getStaffLookups();
    return NextResponse.json({
      success: true,
      message: "Staff lookups retrieved successfully",
      data,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
