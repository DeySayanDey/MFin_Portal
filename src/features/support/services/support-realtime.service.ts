import "server-only";

import { api } from "@/lib/api/client";
import { endpoints, joinApiUrl } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { getSessionUser } from "@/lib/auth/session";
import { getSupportApiConfig, supportClientListHeaders } from "@/lib/config/support-api";
import { mapSupportRealtime, supportAuthEndpoint } from "@/features/support/mappers/support-ticket.mapper";
import { readSupportClientToken } from "@/features/support/services/support-client-token";
import type { SupportRealtimeConfig } from "@/features/support/types/support-ticket.types";
import { TICKET_NUMBER_PATTERN } from "@/features/support/types/support-ticket.types";

const CUSTOMER_CHANNEL = /^private-customer\.[A-Za-z0-9._-]{1,120}$/;
const TICKET_CHANNEL = /^private-ticket\.\d{1,12}$/;
const SOCKET_ID = /^\d+\.\d+$/;

function supportCall(headers: HeadersInit) {
  return {
    baseUrl: getSupportApiConfig().url,
    headers,
  };
}

/** Direct Reverb listener. Apache proxies the socket on the API port, so the browser must not open this. */
const DIRECT_REVERB_PORT = 8094;

/** API host and port, used only when the realtime payload still points at the direct Reverb port. */
function socketFromApiUrl(apiUrl: string): Pick<SupportRealtimeConfig, "host" | "port" | "scheme"> | null {
  let parsed: URL;
  try {
    parsed = new URL(apiUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const scheme = parsed.protocol === "https:" ? "https" : "http";
  const portNumber = parsed.port ? Number(parsed.port) : scheme === "https" ? 443 : 80;
  const host = parsed.hostname.toLowerCase();
  if (!host || !Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) return null;
  return { host, port: portNumber, scheme };
}

async function requireClient() {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError({
      message: "Unauthorized",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }
  const client = await readSupportClientToken(user.userId);
  if (!client) return null;
  return client;
}

/** Customer websocket settings. Null when this user has not raised a ticket yet. */
export async function getSupportRealtime(number?: string | null): Promise<SupportRealtimeConfig | null> {
  const ticketNumber = number?.trim().toUpperCase() ?? "";
  if (ticketNumber && !TICKET_NUMBER_PATTERN.test(ticketNumber)) {
    throw new ApiError({
      message: "Ticket not found",
      status: 404,
      code: "NOT_FOUND",
    });
  }

  const user = await getSessionUser();
  const client = await requireClient();
  if (!user || !client) return null;
  const phone = (user.userPhone || user.userMob || client.phone).trim();
  if (!phone) return null;

  const config = getSupportApiConfig();
  const data = await api.get<unknown>(endpoints.supportTicket.realtime, {
    ...supportCall(supportClientListHeaders(config, client.token)),
    expectEnvelope: true,
    searchParams: {
      phone,
      number: ticketNumber || undefined,
    },
  });
  const mapped = mapSupportRealtime(data);
  if (!mapped || mapped.port !== DIRECT_REVERB_PORT) return mapped;
  const socket = socketFromApiUrl(config.url);
  if (!socket || socket.port === DIRECT_REVERB_PORT) return null;
  return { ...mapped, host: socket.host, port: socket.port, scheme: socket.scheme };
}

/**
 * Private-channel auth for Echo. The support API returns `{ auth }` here,
 * not the usual success envelope. Phone comes from the sealed client token.
 */
export async function authorizeSupportRealtime(input: unknown): Promise<{ auth: string }> {
  const record =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const socketId = typeof record.socket_id === "string" ? record.socket_id.trim() : "";
  const channelName = typeof record.channel_name === "string" ? record.channel_name.trim() : "";
  if (!SOCKET_ID.test(socketId) || (!CUSTOMER_CHANNEL.test(channelName) && !TICKET_CHANNEL.test(channelName))) {
    throw new ApiError({
      message: "You do not have access to this action.",
      status: 403,
      code: "FORBIDDEN",
    });
  }

  const client = await requireClient();
  if (!client) {
    throw new ApiError({
      message: "Sign in is required.",
      status: 403,
      code: "FORBIDDEN",
    });
  }

  const config = getSupportApiConfig();
  const headers = supportClientListHeaders(config, client.token);
  const settings = await api.get<unknown>(endpoints.supportTicket.realtime, {
    ...supportCall(headers),
    expectEnvelope: true,
    searchParams: { phone: client.phone || undefined },
  });
  const authUrl =
    supportAuthEndpoint(settings, config.url) ??
    joinApiUrl(config.url, endpoints.supportTicket.realtimeAuth);
  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      socket_id: socketId,
      channel_name: channelName,
      phone: client.phone,
    }),
    cache: "no-store",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError({
      message: "You do not have access to this action.",
      status: response.status === 401 ? 403 : response.status,
      code: "FORBIDDEN",
    });
  }
  const body = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const auth = typeof body.auth === "string" ? body.auth : "";
  if (!auth || auth.length > 2000) {
    throw new ApiError({
      message: "You do not have access to this action.",
      status: 403,
      code: "FORBIDDEN",
    });
  }
  return { auth };
}
