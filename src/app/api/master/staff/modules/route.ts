import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { getStaffModules, saveStaffModules } from "@/features/master/staff/services/staff.service";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const staffId = Number(new URL(request.url).searchParams.get("staff_id"));
    return NextResponse.json({ success: true, data: await getStaffModules(staffId) });
  } catch (error) { return toBffErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    return NextResponse.json({ success: true, data: await saveStaffModules(await request.json()) });
  } catch (error) { return toBffErrorResponse(error); }
}
