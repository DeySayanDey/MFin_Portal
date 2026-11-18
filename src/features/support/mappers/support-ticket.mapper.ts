import type {
  RaiseTicketInput,
  ReplyTicketInput,
  SupportRealtimeConfig,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketListResult,
  SupportTicketMessage,
  SupportTicketScreenshot,
} from "@/features/support/types/support-ticket.types";
import {
  TICKET_MESSAGE_SIDES,
  TICKET_PRIORITIES,
} from "@/features/support/types/support-ticket.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function mapSupportTicket(row: unknown): SupportTicket | null {
  const record = asRecord(row);
  if (!record) return null;
  const number = pickString(record, ["number"]);
  const subject = pickString(record, ["subject"]);
  if (!number || !subject) return null;
  const rawPriority = pickString(record, ["priority"]).toUpperCase();
  const priority = (TICKET_PRIORITIES as readonly string[]).includes(rawPriority)
    ? rawPriority
    : rawPriority || "MEDIUM";
  const remark = pickString(record, ["remark"]);
  return {
    number,
    subject,
    priority,
    status: pickString(record, ["status"]).toUpperCase() || "OPEN",
    remark: remark || null,
    createdAt: pickString(record, ["createdAt", "created_at"]) || null,
    updatedAt: pickString(record, ["updatedAt", "updated_at"]) || null,
  };
}

function mapScreenshots(value: unknown): SupportTicketScreenshot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((shot) => {
    const record = asRecord(shot);
    if (!record) return [];
    const url = pickString(record, ["url"]);
    if (!url.startsWith("http://") && !url.startsWith("https://")) return [];
    return [{ name: pickString(record, ["name"]) || "Screenshot", url }];
  });
}

export function mapSupportTicketDetail(row: unknown): SupportTicketDetail | null {
  const ticket = mapSupportTicket(row);
  const record = asRecord(row);
  if (!ticket || !record) return null;
  const customerName = pickString(record, ["customerName", "customer_name"]);
  const customerPhone = pickString(record, ["customerPhone", "customer_phone"]);
  return {
    ...ticket,
    description: pickString(record, ["description"]),
    customerName: customerName || null,
    customerPhone: customerPhone || null,
    screenshots: mapScreenshots(record.screenshots),
  };
}

function pickNumber(row: Record<string, unknown>, key: string): number | null {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapSupportTicketListResult(
  data: unknown,
  fallback: { page: number; pageSize: number },
): SupportTicketListResult {
  const record = asRecord(data);
  const rows = record && Array.isArray(record.items) ? record.items : Array.isArray(data) ? data : [];
  const items = rows.flatMap((row) => {
    const ticket = mapSupportTicket(row);
    return ticket ? [ticket] : [];
  });
  const total = record ? (pickNumber(record, "total") ?? items.length) : items.length;
  const page = record ? (pickNumber(record, "page") ?? fallback.page) : fallback.page;
  const pageSize = record ? (pickNumber(record, "pageSize") ?? fallback.pageSize) : fallback.pageSize;
  const from = record ? (pickNumber(record, "from") ?? (items.length > 0 ? 1 : 0)) : items.length > 0 ? 1 : 0;
  const to = record ? (pickNumber(record, "to") ?? items.length) : items.length;
  return { items, total, page, pageSize, from, to };
}

export function mapSupportTicketMessage(row: unknown): SupportTicketMessage | null {
  const record = asRecord(row);
  if (!record) return null;
  const id = pickString(record, ["id"]);
  const rawSide = pickString(record, ["side"]).toLowerCase();
  const side = (TICKET_MESSAGE_SIDES as readonly string[]).includes(rawSide)
    ? (rawSide as SupportTicketMessage["side"])
    : "client";
  return {
    id: id || "0",
    side,
    authorName: pickString(record, ["authorName", "author_name"]),
    message: pickString(record, ["message"]),
    screenshots: mapScreenshots(record.screenshots),
    createdAt: pickString(record, ["createdAt", "created_at"]) || null,
  };
}

export function mapSupportTicketMessages(data: unknown): SupportTicketMessage[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    const message = mapSupportTicketMessage(row);
    return message ? [message] : [];
  });
}

export function readAccessToken(data: unknown): string | null {
  const record = asRecord(data);
  const token = record ? pickString(record, ["accessToken", "access_token"]) : "";
  return token || null;
}

/** Domain raise. API key and project domain. Screenshot bytes travel only in `data`. */
export function mapRaiseRedirectToDto(input: RaiseTicketInput, domain: string) {
  return {
    domain,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    subject: input.subject,
    description: input.description,
    priority: input.priority,
    screenshots: input.screenshots.map((shot) => ({
      name: shot.name,
      data: shot.data,
    })),
  };
}

function isSafeHost(value: string): boolean {
  return /^[a-z0-9.-]+$/.test(value) && !value.startsWith(".") && !value.endsWith(".") && !value.includes("..");
}

/** Auth URL from the realtime payload, only when it stays on the configured API host. */
export function supportAuthEndpoint(data: unknown, apiBase: string): string | null {
  const record = asRecord(data);
  const endpoint = record ? pickString(record, ["authEndpoint", "auth_endpoint"]) : "";
  if (!endpoint) return null;
  try {
    const target = new URL(endpoint);
    const base = new URL(apiBase);
    const allowedPath = "/integrations/redirect/realtime/auth";
    if (target.origin !== base.origin) return null;
    if (!target.pathname.endsWith(allowedPath)) return null;
    return target.toString();
  } catch {
    return null;
  }
}

export function mapSupportRealtime(data: unknown): SupportRealtimeConfig | null {
  const record = asRecord(data);
  if (!record) return null;
  const key = pickString(record, ["key"]);
  const host = pickString(record, ["host"]).toLowerCase();
  const scheme = pickString(record, ["scheme"]).toLowerCase();
  const customerChannel = pickString(record, ["customerChannel", "customer_channel"]);
  const ticketRaw = pickString(record, ["ticketChannel", "ticket_channel"]);
  const portValue = record.port;
  const port = typeof portValue === "number" ? portValue : Number(portValue);
  if (!key || key.length > 200) return null;
  if (!isSafeHost(host) || host.length > 255) return null;
  if (scheme !== "http" && scheme !== "https") return null;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  if (!/^customer\.[A-Za-z0-9._-]{1,120}$/.test(customerChannel)) return null;
  if (ticketRaw && !/^ticket\.\d{1,12}$/.test(ticketRaw)) return null;
  return {
    broadcaster: "reverb",
    key,
    host,
    port,
    scheme,
    customerChannel,
    ticketChannel: ticketRaw || null,
  };
}

export function mapTicketReplyToDto(input: ReplyTicketInput) {
  return {
    message: input.message.trim(),
    screenshots: input.screenshots.map((shot) => ({
      name: shot.name,
      data: shot.data,
    })),
  };
}
