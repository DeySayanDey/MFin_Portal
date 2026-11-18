import { NextResponse } from "next/server";
import { getSupportRealtime } from "@/features/support/services/support-realtime.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const number = new URL(request.url).searchParams.get("number");
    const config = await getSupportRealtime(number);
    return NextResponse.json({
      success: true,
      message: config ? "Realtime ready" : "Realtime unavailable",
      data: config,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
