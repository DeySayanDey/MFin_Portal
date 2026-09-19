import { NextResponse } from "next/server";
import { loginRequestSchema } from "@/features/auth/types/auth";
import { loginWithLaravel } from "@/features/auth/services/auth-service";
import { toBffErrorResponse, sanitizeClientErrors } from "@/lib/api/bff-response";

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = loginRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          code: "VALIDATION",
          errors: sanitizeClientErrors(parsed.error.flatten()),
          data: null,
        },
        { status: 422 },
      );
    }

    const user = await loginWithLaravel(parsed.data);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: { user },
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
