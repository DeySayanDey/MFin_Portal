import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { exportLoans } from "@/features/legacy-opening/services/opening-loan.service";

export async function GET(request: Request) {
  try {
    await requireSessionUser(); const params = new URL(request.url).searchParams; const ids = params.getAll("opening_ids[]");
    const csv = await exportLoans({ ...Object.fromEntries(params), ...(ids.length ? { "opening_ids[]": ids } : {}) });
    if (typeof csv !== "string") throw new Error("Unexpected CSV response");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="opening-loan-drafts.csv"', "Cache-Control": "no-store" } });
  } catch (error) { return toBffErrorResponse(error); }
}
