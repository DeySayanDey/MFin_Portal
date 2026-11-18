import { NextResponse } from "next/server";
import {
  getRbiLendingPolicy,
  updateRbiLendingPolicy,
} from "@/features/master/rbi-lending-policy/services/rbi-lending-policy.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET() {
  try {
    await requireSessionUser();
    const policy = await getRbiLendingPolicy();
    return NextResponse.json({
      success: true,
      message: "RBI lending policy retrieved successfully",
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
    const policy = await updateRbiLendingPolicy(body);
    return NextResponse.json({
      success: true,
      message: "RBI lending policy updated successfully",
      data: policy,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
