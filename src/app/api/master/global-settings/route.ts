import { NextResponse } from "next/server";
import {
  getGlobalSettings,
  updateGlobalSettings,
} from "@/features/master/global-settings/services/global-settings.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET() {
  try {
    await requireSessionUser();
    const settings = await getGlobalSettings();
    return NextResponse.json({
      success: true,
      message: "Global settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    assertHeadOffice(user);
    const body: unknown = await request.json();
    const settings = await updateGlobalSettings(body);
    return NextResponse.json({
      success: true,
      message: "Global settings updated successfully",
      data: settings,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
