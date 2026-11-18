import { NextResponse } from "next/server";
import { authorizeSupportRealtime } from "@/features/support/services/support-realtime.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

/** Echo requires `{ auth }` and rejects the usual success envelope. */
export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body: unknown = await request.json();
    const auth = await authorizeSupportRealtime(body);
    return NextResponse.json(auth);
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
