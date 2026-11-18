import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { listOpeningCustomers } from "@/features/legacy-opening/services/opening-deposit.service";

export async function GET(request: Request) {
  try { await requireSessionUser(); return NextResponse.json({ success: true, data: await listOpeningCustomers(Object.fromEntries(new URL(request.url).searchParams)) }); }
  catch (error) { return toBffErrorResponse(error); }
}
