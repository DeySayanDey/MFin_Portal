import { NextResponse } from "next/server";
import { logoutFromLaravel } from "@/features/auth/services/auth-service";
import { toBffErrorResponse } from "@/lib/api/bff-response";

export async function POST() {
  try {
    await logoutFromLaravel();
    return NextResponse.json({
      success: true,
      message: "Logout successful",
      data: null,
    });
  } catch (error) {
    // Prefer clearing client session even when upstream logout fails.
    return toBffErrorResponse(error);
  }
}
