import { NextResponse } from "next/server";
import { loginRequestSchema } from "@/features/auth/types/auth";
import { loginWithLaravel } from "@/features/auth/services/auth-service";
import { toBffErrorResponse, sanitizeClientErrors } from "@/lib/api/bff-response";
import { isApiError } from "@/lib/api/errors";

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
    if (isApiError(error) && error.status === 423) {
      const details = error.details;
      const minutes = details && typeof details === "object" && "remaining_minutes" in details
        ? details.remaining_minutes
        : undefined;
      const response = toBffErrorResponse(error);
      const payload = await response.json();
      return NextResponse.json({
        ...payload,
        errors: typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0
          ? { remaining_minutes: minutes }
          : null,
      }, { status: 423 });
    }
    return toBffErrorResponse(error);
  }
}
