import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { setStaffFieldStatus } from "@/features/master/staff/services/staff.service";

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const result = await setStaffFieldStatus(await request.json());
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
