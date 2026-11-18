import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { deleteLoans, listLoans, saveLoan } from "@/features/legacy-opening/services/opening-loan.service";

export async function GET(request: Request) {
  try { await requireSessionUser(); const params = new URL(request.url).searchParams; const ids = params.getAll("opening_ids[]"); return NextResponse.json({ success: true, data: await listLoans({ ...Object.fromEntries(params), ...(ids.length ? { "opening_ids[]": ids } : {}) }) }); }
  catch (error) { return toBffErrorResponse(error); }
}
export async function POST(request: Request) {
  try {
    await requireSessionUser(); const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("action" in body)) return NextResponse.json({ success: false, message: "Invalid action" }, { status: 422 });
    const { action, ...data } = body as Record<string, unknown>;
    if (action === "save") return NextResponse.json({ success: true, data: await saveLoan(data) });
    if (action === "delete") return NextResponse.json({ success: true, data: await deleteLoans(data) });
    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 422 });
  } catch (error) { return toBffErrorResponse(error); }
}
