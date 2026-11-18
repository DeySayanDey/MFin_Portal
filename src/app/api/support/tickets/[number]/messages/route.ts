import { NextResponse } from "next/server";
import {
  listSupportTicketMessages,
  replySupportTicket,
} from "@/features/support/services/support-ticket.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

type RouteContext = {
  params: Promise<{ number: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSessionUser();
    const { number } = await context.params;
    const messages = await listSupportTicketMessages(number);
    return NextResponse.json({
      success: true,
      message: "Messages loaded",
      data: messages,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireSessionUser();
    const { number } = await context.params;
    const body: unknown = await request.json();
    const message = await replySupportTicket(number, body);
    return NextResponse.json({
      success: true,
      message: "Message sent",
      data: message,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
