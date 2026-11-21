import { NextResponse } from "next/server";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { getVirtualConfigEditDetails } from "@/features/master/virtual-ac-config/services/virtual-bank.service";

export async function GET(request: Request) {
  try {
    assertHeadOffice(await requireSessionUser());
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ success: false, message: "Invalid configuration" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
    }
    const upstream = await getVirtualConfigEditDetails(id);
    const body = await upstream.text();
    return new NextResponse(body || null, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    const response = toBffErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
