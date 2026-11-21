import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { ifscPattern, lookupIfsc } from "@/features/master/virtual-ac-config/services/ifsc.service";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const code = (new URL(request.url).searchParams.get("code") ?? "").trim().toUpperCase();
    if (!ifscPattern.test(code)) return NextResponse.json({ success: false }, { status: 400 });
    const data = await lookupIfsc(code);
    if (!data) return NextResponse.json({ success: false }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
