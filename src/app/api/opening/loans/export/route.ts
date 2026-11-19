import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { exportLoans } from "@/features/legacy-opening/services/opening-loan.service";

export async function GET(request: Request) {
  try {
    await requireSessionUser(); const params = new URL(request.url).searchParams; const ids = params.getAll("opening_ids[]");
    const workbook = await exportLoans({ ...Object.fromEntries(params), ...(ids.length ? { "opening_ids[]": ids } : {}) });
    return new Response(workbook.data, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": workbook.contentDisposition ?? 'attachment; filename="opening-loan-drafts.xlsx"', "Cache-Control": "no-store" } });
  } catch (error) { return toBffErrorResponse(error); }
}
