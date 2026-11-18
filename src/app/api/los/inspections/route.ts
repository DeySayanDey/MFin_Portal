import { NextResponse } from "next/server";
import {
  createLoanInspection,
  editLoanInspection,
  listLoanInspections,
} from "@/features/los/services/los.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readOptionalText(raw: string | null): string | undefined {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const search =
      readOptionalText(searchParams.get("search")) ??
      readOptionalText(searchParams.get("keyword"));

    const pendingOnlyRaw = searchParams.get("pending_only");
    const pendingOnly =
      pendingOnlyRaw === "1" || pendingOnlyRaw === "true" ? true : undefined;

    const result = await listLoanInspections({
      pending_only: pendingOnly,
      application_id: readOptionalNumber(
        searchParams.get("application_id") ??
          searchParams.get("loan_application_id"),
      ),
      inspection_id: readOptionalNumber(searchParams.get("inspection_id")),
      fo_id: readOptionalNumber(searchParams.get("fo_id")),
      branch_id: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      inspection_result_cd: readOptionalNumber(
        searchParams.get("inspection_result_cd"),
      ),
      from_date: readOptionalText(searchParams.get("from_date")),
      to_date: readOptionalText(searchParams.get("to_date")),
      keyword: search,
      page: readOptionalNumber(searchParams.get("page")),
      per_page: readOptionalNumber(searchParams.get("per_page")),
    });

    return NextResponse.json({
      success: true,
      message: "Loan inspections retrieved successfully",
      data: result,
      meta: { total: result.total },
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const action = formData.get("action");
      formData.delete("action");

      if (action === "edit" || formData.has("inspection_id")) {
        const item = await editLoanInspection(formData);
        return NextResponse.json({
          success: true,
          message: "Field verification updated successfully",
          data: item,
        });
      }

      const item = await createLoanInspection(formData);
      return NextResponse.json(
        {
          success: true,
          message: "Field verification saved successfully",
          data: item,
        },
        { status: 201 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    delete body.action;

    if (action === "edit" || typeof body.inspection_id === "number") {
      const item = await editLoanInspection(body);
      return NextResponse.json({
        success: true,
        message: "Field verification updated successfully",
        data: item,
      });
    }

    const item = await createLoanInspection(body);
    return NextResponse.json(
      {
        success: true,
        message: "Field verification saved successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
