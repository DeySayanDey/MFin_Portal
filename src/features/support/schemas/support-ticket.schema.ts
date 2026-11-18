import { z } from "zod";
import {
  TICKET_IMAGE_MIMES,
  TICKET_PRIORITIES,
  TICKET_SCREENSHOT_MAX_BYTES,
  TICKET_SCREENSHOT_MAX_COUNT,
  TICKET_STATUSES,
} from "@/features/support/types/support-ticket.types";

function base64ByteLength(value: string): number | null {
  const cleaned = value.replace(/\s/g, "");
  if (cleaned.length === 0 || cleaned.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) return null;
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  return Math.floor((cleaned.length * 3) / 4) - padding;
}

function matchesMime(data: string, mime: (typeof TICKET_IMAGE_MIMES)[number]): boolean {
  if (mime === "image/png") return data.startsWith("iVBORw0KGgo");
  if (mime === "image/jpeg") return data.startsWith("/9j/");
  if (mime === "image/gif") return data.startsWith("R0lGOD");
  return data.startsWith("UklGR");
}

const screenshotSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    data: z.string().trim().min(1),
    mime: z.enum(TICKET_IMAGE_MIMES),
  })
  .superRefine((shot, ctx) => {
    const bytes = base64ByteLength(shot.data);
    if (bytes == null || bytes <= 0 || bytes > TICKET_SCREENSHOT_MAX_BYTES) {
      ctx.addIssue({
        code: "custom",
        path: ["data"],
        message: "size",
      });
      return;
    }
    if (!matchesMime(shot.data, shot.mime)) {
      ctx.addIssue({
        code: "custom",
        path: ["data"],
        message: "type",
      });
    }
  });

export const raiseTicketFormSchema = z.object({
  subject: z.string().trim().min(1, "required").max(255, "max"),
  description: z.string().trim().min(1, "required").max(4000, "max"),
  priority: z.enum(TICKET_PRIORITIES).default("MEDIUM"),
  screenshots: z
    .array(screenshotSchema)
    .max(TICKET_SCREENSHOT_MAX_COUNT, "count")
    .default([]),
});

export const raiseTicketInputSchema = raiseTicketFormSchema.extend({
  customerPhone: z.string().trim().min(1, "required").max(30, "max"),
  customerName: z.string().trim().min(1, "required").max(150, "max"),
  domain: z.string().trim().max(255, "max").default(""),
});

const day = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/);

function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export const ticketListQuerySchema = z.object({
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(255).optional()),
  priority: z.preprocess(emptyToUndefined, z.enum(TICKET_PRIORITIES).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(TICKET_STATUSES).optional()),
  fromDate: z.preprocess(emptyToUndefined, day.optional()),
  toDate: z.preprocess(emptyToUndefined, day.optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ticketReplySchema = z
  .object({
    message: z.string().trim().max(4000, "max").default(""),
    screenshots: z
      .array(screenshotSchema)
      .max(TICKET_SCREENSHOT_MAX_COUNT, "count")
      .default([]),
  })
  .superRefine((value, ctx) => {
    if (value.message.length === 0 && value.screenshots.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["message"],
        message: "required",
      });
    }
  });
