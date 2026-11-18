export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export type TicketImageMime = (typeof TICKET_IMAGE_MIMES)[number];

/** 20 MB per screenshot. */
export const TICKET_SCREENSHOT_MAX_BYTES = 20 * 1024 * 1024;

export const TICKET_SCREENSHOT_MAX_COUNT = 10;

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

/** Support desk ticket numbers, for example TKT-000009. */
export const TICKET_NUMBER_PATTERN = /^TKT-\d{6}$/;

export type TicketScreenshotInput = {
  name: string;
  /** Raw base64 file bytes, without a data-URL prefix. */
  data: string;
  mime: TicketImageMime;
};

export type RaiseTicketFormInput = {
  subject: string;
  description: string;
  priority: TicketPriority;
  screenshots: TicketScreenshotInput[];
};

export type RaiseTicketInput = RaiseTicketFormInput & {
  /** Signed-in user's mobile number. This is the client mapping. */
  customerPhone: string;
  /** Organization display name. Required by the domain raise call. */
  customerName: string;
  /** Host of the address the portal is open on, for example `localhost:3000`. */
  domain: string;
};

export type SupportTicketScreenshot = {
  name: string;
  url: string;
};

export type SupportTicket = {
  number: string;
  subject: string;
  priority: string;
  status: string;
  remark: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportTicketDetail = SupportTicket & {
  description: string;
  customerName: string | null;
  customerPhone: string | null;
  screenshots: SupportTicketScreenshot[];
};

export type SupportTicketListQuery = {
  search?: string;
  priority?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
};

export type SupportTicketListResult = {
  items: SupportTicket[];
  total: number;
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

export const TICKET_MESSAGE_SIDES = ["client", "staff"] as const;

export type TicketMessageSide = (typeof TICKET_MESSAGE_SIDES)[number];

export type SupportTicketMessage = {
  id: string;
  side: TicketMessageSide;
  authorName: string;
  message: string;
  screenshots: SupportTicketScreenshot[];
  createdAt: string | null;
};

export type ReplyTicketInput = {
  message: string;
  screenshots: TicketScreenshotInput[];
};

/** Public websocket settings for this client's ticket list. The API key stays on the server. */
export type SupportRealtimeConfig = {
  broadcaster: "reverb";
  key: string;
  host: string;
  port: number;
  scheme: "http" | "https";
  customerChannel: string;
  ticketChannel: string | null;
};
