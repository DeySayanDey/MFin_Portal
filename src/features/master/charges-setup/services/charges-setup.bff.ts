import { NextResponse } from "next/server";
import {
  createCharge,
  listCharges,
  toggleChargeStatus,
  updateCharge,
} from "@/features/master/charges-setup/services/charges-setup.service";
import type { ChargeKind } from "@/features/master/charges-setup/types/charges-setup.types";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

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

function readChargeId(body: Record<string, unknown>): number | undefined {
  if (typeof body.chargeId === "number" && body.chargeId > 0) return body.chargeId;
  if (typeof body.charge_id === "number" && body.charge_id > 0) {
    return body.charge_id;
  }
  return undefined;
}

function label(kind: ChargeKind): string {
  return kind === "deposit" ? "Deposit charges" : "Loan charges";
}

export async function handleChargesGet(kind: ChargeKind, request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const search =
      readOptionalText(searchParams.get("keyword")) ??
      readOptionalText(searchParams.get("search"));
    const isActiveRaw =
      searchParams.get("is_active") ?? searchParams.get("status");
    const duringRaw =
      kind === "deposit"
        ? (searchParams.get("charges_during_cd") ??
          searchParams.get("chargesDuringCd"))
        : (searchParams.get("deduct_during_cd") ??
          searchParams.get("deductDuringCd"));

    const refundableRaw = searchParams.get("is_refundable");
    const isRefundable =
      kind !== "loan" || refundableRaw == null || refundableRaw === ""
        ? undefined
        : refundableRaw === "1" || refundableRaw === "true";
    const result = await listCharges(kind, {
      page: readOptionalNumber(searchParams.get("page")),
      perPage: readOptionalNumber(searchParams.get("per_page")),
      chargeId: readOptionalNumber(searchParams.get("charge_id")),
      search,
      figureCd: readOptionalNumber(searchParams.get("figure_cd")),
      duringCd: readOptionalNumber(duringRaw),
      isRefundable,
      isActive: readOptionalNumber(isActiveRaw),
    });

    return NextResponse.json({
      success: true,
      message: `${label(kind)} retrieved successfully`,
      data: result,
      meta: result.meta,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function handleChargesPost(kind: ChargeKind, request: Request) {
  try {
    const user = await requireSessionUser();
    assertHeadOffice(user);
    const body = (await request.json()) as Record<string, unknown>;

    if (body.action === "status") {
      const chargeId = readChargeId(body);
      const isActive =
        typeof body.isActive === "boolean"
          ? body.isActive
          : typeof body.is_active === "boolean"
            ? body.is_active
            : false;
      if (!chargeId) {
        return NextResponse.json(
          { success: false, message: "charge_id is required" },
          { status: 422 },
        );
      }
      const item = await toggleChargeStatus(kind, chargeId, isActive);
      return NextResponse.json({
        success: true,
        message: isActive
          ? `${label(kind)} activated successfully`
          : `${label(kind)} deactivated successfully`,
        data: item,
      });
    }

    const payload = { ...body };
    delete payload.action;
    const chargeId = readChargeId(payload);
    const isUpdate = body.action === "update" || chargeId != null;

    if (isUpdate) {
      const item = await updateCharge(kind, { ...payload, chargeId });
      return NextResponse.json({
        success: true,
        message: `${label(kind)} updated successfully`,
        data: item,
      });
    }

    const item = await createCharge(kind, payload);
    return NextResponse.json(
      {
        success: true,
        message: `${label(kind)} created successfully`,
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
