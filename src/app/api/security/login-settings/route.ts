import { NextResponse } from "next/server";
import {
  getSecurityPolicy,
  updateSecurityPolicy,
} from "@/features/security/login-settings/services/login-settings.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET() {
  try {
    const user = await requireSessionUser();
    assertHeadOffice(user);
    const policy = await getSecurityPolicy();
    return NextResponse.json({
      success: true,
      message: "Security policy retrieved successfully",
      data: policy,
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
    const policy = await updateSecurityPolicy(body);
    return NextResponse.json({
      success: true,
      message: "Security policy updated successfully",
      data: policy,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
