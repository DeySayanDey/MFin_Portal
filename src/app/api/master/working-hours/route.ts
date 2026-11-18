import { NextResponse } from "next/server";
import {
  getWorkingHours,
  updateWorkingHours,
} from "@/features/master/working-hours/services/working-hours.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET() {
  try {
    await requireSessionUser();
    const workingHours = await getWorkingHours();
    return NextResponse.json({
      success: true,
      message: "Working hours retrieved successfully",
      data: workingHours,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    assertHeadOffice(user);
    const body: unknown = await request.json();
    const workingHours = await updateWorkingHours(body);
    return NextResponse.json({
      success: true,
      message: "Working hours updated successfully",
      data: workingHours,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
