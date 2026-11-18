import { NextResponse } from "next/server";
import {
  addShareSubscription,
  approveShareSubscription,
  editShareSubscription,
  getShareHolding,
  listShareSubscriptions,
} from "@/features/onboarding/share-subscription/services/share-subscription.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser, resolveBranchFilter } from "@/lib/auth/bff-scope";

function readOptionalNumber(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readOptionalText(raw: string | null): string | undefined {
  const trimmed = raw?.trim() ?? "";
  return trimmed === "" ? undefined : trimmed;
}

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("view") === "holding") {
      const holding = await getShareHolding({
        custTypeCd: readOptionalNumber(searchParams.get("cust_type_cd")),
        customerId: readOptionalNumber(searchParams.get("customer_id")),
      });
      return NextResponse.json({
        success: true,
        message: "Share holding retrieved successfully",
        data: holding,
      });
    }

    const result = await listShareSubscriptions({
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      subscriptionId: readOptionalNumber(searchParams.get("subscription_id")),
      custTypeCd: readOptionalNumber(searchParams.get("cust_type_cd")),
      customerId: readOptionalNumber(searchParams.get("customer_id")),
      branchId: resolveBranchFilter(
        user,
        readOptionalNumber(searchParams.get("branch_id")),
      ),
      statusCd: readOptionalNumber(searchParams.get("tr_status_cd")),
      fromDate: readOptionalText(searchParams.get("from_date")),
      toDate: readOptionalText(searchParams.get("to_date")),
      search: readOptionalText(searchParams.get("keyword")),
    });
    return NextResponse.json({
      success: true,
      message: "Share subscriptions retrieved successfully",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const { action, ...payload } = body;
    const result =
      action === "approve"
        ? await approveShareSubscription(payload)
        : action === "edit"
          ? await editShareSubscription(payload)
          : await addShareSubscription(payload);
    return NextResponse.json(
      { success: true, message: result.message, data: result.item },
      { status: action === "approve" || action === "edit" ? 200 : 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
