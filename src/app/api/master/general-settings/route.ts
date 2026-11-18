import { NextResponse } from "next/server";
import {
  bulkChangeGeneralSettingStatus,
  changeGeneralSettingStatus,
  listGeneralSettings,
} from "@/features/master/general-settings/services/general-settings.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

/** `mst_settings_general.Id` is a signed tinyint, so the table can never hold more rows than this. */
const MAX_BULK_IDS = 127;

export async function GET() {
  try {
    await requireSessionUser();
    const items = await listGeneralSettings();
    return NextResponse.json({
      success: true,
      message: "General settings retrieved successfully",
      data: items,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    assertHeadOffice(user);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const isActive = body?.isActive;

    if (body?.action === "bulk") {
      const rawIds = Array.isArray(body.ids) ? body.ids : [];
      const ids = [...new Set(rawIds.map(Number))];
      if (
        ids.length === 0 ||
        ids.length > MAX_BULK_IDS ||
        ids.some((value) => !Number.isInteger(value) || value <= 0) ||
        typeof isActive !== "boolean"
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid bulk status request" },
          { status: 422 },
        );
      }
      const result = await bulkChangeGeneralSettingStatus({ ids, isActive });
      return NextResponse.json({
        success: true,
        message: result.message || "General settings updated successfully",
        data: result.items,
      });
    }

    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0 || typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Invalid general setting status request" },
        { status: 422 },
      );
    }
    const result = await changeGeneralSettingStatus({ id, isActive });
    return NextResponse.json({
      success: true,
      message: result.message || "General setting updated successfully",
      data: result.item,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
