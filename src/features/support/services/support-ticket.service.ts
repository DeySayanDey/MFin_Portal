import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { getSessionUser } from "@/lib/auth/session";
import {
  getSupportApiConfig,
  supportClientListHeaders,
  supportKeyHeaders,
} from "@/lib/config/support-api";
import {
  mapRaiseRedirectToDto,
  mapSupportTicket,
  mapSupportTicketDetail,
  mapSupportTicketListResult,
  mapSupportTicketMessage,
  mapSupportTicketMessages,
  mapTicketReplyToDto,
  readAccessToken,
} from "@/features/support/mappers/support-ticket.mapper";
import { projectDomain } from "@/features/support/services/support-domain";
import {
  raiseTicketInputSchema,
  ticketListQuerySchema,
  ticketReplySchema,
} from "@/features/support/schemas/support-ticket.schema";
import {
  clearSupportClientToken,
  readSupportClientToken,
  saveSupportClientToken,
} from "@/features/support/services/support-client-token";
import type {
  SupportTicket,
  SupportTicketDetail,
  SupportTicketListResult,
  SupportTicketMessage,
} from "@/features/support/types/support-ticket.types";
import { TICKET_NUMBER_PATTERN } from "@/features/support/types/support-ticket.types";

function supportOptions(headers: HeadersInit) {
  const config = getSupportApiConfig();
  return {
    baseUrl: config.url,
    headers,
  };
}

/**
 * A support-desk 401 is an API key or client-token failure, not a portal logout.
 * Keep it off HTTP 401 so the browser session stays signed in.
 */
function asPortalSafeError(error: unknown): never {
  if (error instanceof ApiError && error.status === 401) {
    throw new ApiError({
      message: error.message,
      status: 403,
      code: "FORBIDDEN",
      upstream: error.upstream,
    });
  }
  throw error;
}

function isClientSignInFailure(error: unknown): boolean {
  if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) {
    return false;
  }
  return /sign in is required/i.test(error.message);
}

function customerPhone(
  user: { userPhone?: string | null; userMob?: string },
  storedPhone?: string,
): string {
  return (user.userPhone || user.userMob || storedPhone || "").trim().slice(0, 30);
}

async function requirePortalUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError({
      message: "Unauthorized",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }
  return user;
}

function emptyTicketList(page: number, pageSize: number): SupportTicketListResult {
  return { items: [], total: 0, page, pageSize, from: 0, to: 0 };
}

function ticketNumberOr404(number: string): string {
  const ticketNumber = number.trim().toUpperCase();
  if (!TICKET_NUMBER_PATTERN.test(ticketNumber)) {
    throw new ApiError({
      message: "Ticket not found",
      status: 404,
      code: "NOT_FOUND",
    });
  }
  return ticketNumber;
}

/** Paged tickets for the phone number stored in the client token. */
export async function listSupportTickets(input: unknown): Promise<SupportTicketListResult> {
  const validated = ticketListQuerySchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }

  const query = validated.data;
  const user = await requirePortalUser();
  const client = await readSupportClientToken(user.userId);
  const phone = customerPhone(user, query.phone || client?.phone);
  if (!client || !phone) return emptyTicketList(query.page, query.pageSize);

  const config = getSupportApiConfig();
  try {
    const data = await api.get<unknown>(endpoints.supportTicket.list, {
      ...supportOptions(supportClientListHeaders(config, client.token)),
      expectEnvelope: true,
      searchParams: {
        phone,
        search: query.search,
        priority: query.priority,
        status: query.status,
        fromDate: query.fromDate,
        toDate: query.toDate,
        page: query.page,
        pageSize: query.pageSize,
      },
    });
    return mapSupportTicketListResult(data, { page: query.page, pageSize: query.pageSize });
  } catch (error) {
    if (isClientSignInFailure(error)) {
      await clearSupportClientToken(user.userId);
      return emptyTicketList(query.page, query.pageSize);
    }
    asPortalSafeError(error);
  }
}

function resolveSupportDomain(runDomain: string, submitted: string): string {
  return projectDomain(runDomain) || projectDomain(submitted);
}

/** Domain raise. API key and project domain. The API secret is not sent. */
export async function raiseSupportTicket(
  input: unknown,
  runDomain = "",
): Promise<SupportTicket> {
  const validated = raiseTicketInputSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }

  const user = await requirePortalUser();
  const config = getSupportApiConfig();
  const domain = resolveSupportDomain(runDomain, validated.data.domain);

  if (!domain) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
    });
  }

  try {
    const data = await api.post<unknown>(
      endpoints.supportTicket.redirectAdd,
      mapRaiseRedirectToDto(validated.data, domain),
      {
        ...supportOptions(supportKeyHeaders(config)),
        expectEnvelope: true,
      },
    );
    const ticket = mapSupportTicket(data);
    if (!ticket) {
      throw new ApiError({
        message: "Ticket created",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    const accessToken = readAccessToken(data);
    if (accessToken) {
      await saveSupportClientToken({
        userId: user.userId,
        phone: validated.data.customerPhone,
        token: accessToken,
      });
    }
    return ticket;
  } catch (error) {
    asPortalSafeError(error);
  }
}

/** Client detail. Key and client token, with the same phone used to raise the ticket. */
export async function getSupportTicket(number: string): Promise<SupportTicketDetail> {
  const user = await requirePortalUser();
  const ticketNumber = ticketNumberOr404(number);

  const client = await readSupportClientToken(user.userId);
  if (!client) {
    throw new ApiError({
      message: "Sign in is required.",
      status: 403,
      code: "FORBIDDEN",
    });
  }

  const config = getSupportApiConfig();
  try {
    const data = await api.get<unknown>(
      `${endpoints.supportTicket.one}/${encodeURIComponent(ticketNumber)}`,
      {
        ...supportOptions(supportClientListHeaders(config, client.token)),
        expectEnvelope: true,
        searchParams: { phone: customerPhone(user, client.phone) },
      },
    );
    const ticket = mapSupportTicketDetail(data);
    if (!ticket) {
      throw new ApiError({
        message: "Ticket not found",
        status: 404,
        code: "NOT_FOUND",
      });
    }
    return ticket;
  } catch (error) {
    asPortalSafeError(error);
  }
}

async function requireTicketClient(number: string) {
  const user = await requirePortalUser();
  const ticketNumber = ticketNumberOr404(number);
  const client = await readSupportClientToken(user.userId);
  if (!client) {
    throw new ApiError({
      message: "Sign in is required.",
      status: 403,
      code: "FORBIDDEN",
    });
  }
  return { user, ticketNumber, client };
}

export async function listSupportTicketMessages(number: string): Promise<SupportTicketMessage[]> {
  const { user, ticketNumber, client } = await requireTicketClient(number);
  const config = getSupportApiConfig();
  try {
    const data = await api.get<unknown>(
      `${endpoints.supportTicket.one}/${encodeURIComponent(ticketNumber)}/messages`,
      {
        ...supportOptions(supportClientListHeaders(config, client.token)),
        expectEnvelope: true,
        searchParams: { phone: customerPhone(user, client.phone) },
      },
    );
    return mapSupportTicketMessages(data);
  } catch (error) {
    asPortalSafeError(error);
  }
}

export async function replySupportTicket(
  number: string,
  input: unknown,
): Promise<SupportTicketMessage> {
  const validated = ticketReplySchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }

  const { user, ticketNumber, client } = await requireTicketClient(number);
  const config = getSupportApiConfig();
  try {
    const data = await api.post<unknown>(
      `${endpoints.supportTicket.one}/${encodeURIComponent(ticketNumber)}/messages`,
      mapTicketReplyToDto(validated.data),
      {
        ...supportOptions(supportClientListHeaders(config, client.token)),
        expectEnvelope: true,
        searchParams: { phone: customerPhone(user, client.phone) },
      },
    );
    const message = mapSupportTicketMessage(data);
    if (!message) {
      throw new ApiError({
        message: "Message sent",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    return message;
  } catch (error) {
    asPortalSafeError(error);
  }
}
