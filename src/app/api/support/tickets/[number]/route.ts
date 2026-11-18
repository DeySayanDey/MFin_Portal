import { NextResponse } from "next/server";
import { getSupportTicket } from "@/features/support/services/support-ticket.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

type RouteContext = {
  params: Promise<{ number: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSessionUser();
    const { number } = await context.params;
    const ticket = await getSupportTicket(number);
    return NextResponse.json({
      success: true,
      message: "Ticket loaded",
      data: ticket,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
