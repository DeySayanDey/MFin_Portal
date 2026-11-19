import { requireSessionUser } from "@/lib/auth/bff-scope";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { exportOpeningDrafts } from "@/features/legacy-opening/services/opening-deposit.service";

export async function GET(request: Request) {
  let stage = "session";
  try {
    await requireSessionUser();
    stage = "export";
    const params = new URL(request.url).searchParams;
    const ids = params.getAll("opening_ids[]");
    const workbook = await exportOpeningDrafts({ ...Object.fromEntries(params), ...(ids.length ? { "opening_ids[]": ids } : {}) });
    stage = "response";
    return new Response(workbook.data, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": workbook.contentDisposition ?? 'attachment; filename="opening-deposit-drafts.xlsx"', "Cache-Control": "no-store" } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[opening deposit export]", { stage, errorType: error instanceof Error ? error.name : typeof error });
    }
    return toBffErrorResponse(error);
  }
}
