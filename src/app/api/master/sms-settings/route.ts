import { NextResponse } from "next/server";
import {
  getSmsSettings,
  updateSmsSettings,
} from "@/features/master/sms-settings/services/sms-settings.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET() {
  try {
    await requireSessionUser();
    const settings = await getSmsSettings();
    return NextResponse.json({
      success: true,
      message: "SMS settings retrieved successfully",
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
    const settings = await updateSmsSettings(body);
    return NextResponse.json({
      success: true,
      message: "SMS settings updated successfully",
      data: settings,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
