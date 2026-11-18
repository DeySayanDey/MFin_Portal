import { NextResponse } from "next/server";
import {
  getWhatsAppSettings,
  updateWhatsAppSettings,
} from "@/features/master/whatsapp-settings/services/whatsapp-settings.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET() {
  try {
    await requireSessionUser();
    const settings = await getWhatsAppSettings();
    return NextResponse.json({
      success: true,
      message: "WhatsApp settings retrieved successfully",
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
    const settings = await updateWhatsAppSettings(body);
    return NextResponse.json({
      success: true,
      message: "WhatsApp settings updated successfully",
      data: settings,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
