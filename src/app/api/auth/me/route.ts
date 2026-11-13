import { NextResponse } from "next/server";
import { fetchCurrentUserFromLaravel } from "@/features/auth/services/auth-service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { isApiError } from "@/lib/api/errors";
import { clearAuthSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await fetchCurrentUserFromLaravel();
    return NextResponse.json({
      success: true,
      message: "User retrieved successfully",
      data: { user },
    });
  } catch (error) {
    if (isApiError(error) && error.isUnauthorized) await clearAuthSession();
    return toBffErrorResponse(error);
  }
}
