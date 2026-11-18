import { NextResponse } from "next/server";
import {
  getOrganization,
  updateOrganization,
} from "@/features/master/organization/services/organization.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { assertHeadOffice, requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET() {
  try {
    await requireSessionUser();
    const organization = await getOrganization();
    return NextResponse.json({
      success: true,
      message: "Organization retrieved successfully",
      data: organization,
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
    const organization = await updateOrganization(body);
    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      data: organization,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
