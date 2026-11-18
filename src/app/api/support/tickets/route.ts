import { NextResponse } from "next/server";
import {
  listSupportTickets,
  raiseSupportTicket,
} from "@/features/support/services/support-ticket.service";
import { currentRunDomain } from "@/features/support/services/support-domain";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const url = new URL(request.url);
    const result = await listSupportTickets({
      phone: url.searchParams.get("phone") ?? "",
      search: url.searchParams.get("search") ?? "",
      priority: url.searchParams.get("priority") ?? "",
      status: url.searchParams.get("status") ?? "",
      fromDate: url.searchParams.get("fromDate") ?? "",
      toDate: url.searchParams.get("toDate") ?? "",
      page: url.searchParams.get("page") ?? "1",
      pageSize: url.searchParams.get("pageSize") ?? "20",
    });
    return NextResponse.json({
      success: true,
      message: "Tickets loaded",
      data: result,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body: unknown = await request.json();
    const ticket = await raiseSupportTicket(body, currentRunDomain(request));
    return NextResponse.json({
      success: true,
      message: "Ticket created",
      data: ticket,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
