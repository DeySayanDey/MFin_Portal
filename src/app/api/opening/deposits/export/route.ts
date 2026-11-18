import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { exportOpeningDrafts } from "@/features/legacy-opening/services/opening-deposit.service";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const params = new URL(request.url).searchParams;
    const ids = params.getAll("opening_ids[]");
    const csv = await exportOpeningDrafts({ ...Object.fromEntries(params), ...(ids.length ? { "opening_ids[]": ids } : {}) });
    if (typeof csv !== "string") throw new Error("Unexpected CSV response");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="opening-deposit-drafts.csv"', "Cache-Control": "no-store" } });
  } catch (error) { return toBffErrorResponse(error); }
}
