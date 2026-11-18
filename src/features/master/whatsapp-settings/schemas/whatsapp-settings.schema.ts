import { z } from "zod";

const boolish = z
  .union([
    z.boolean(),
    z.literal(0),
    z.literal(1),
    z.literal("0"),
    z.literal("1"),
  ])
  .transform((value) => value === true || value === 1 || value === "1");

/**
 * Laravel may return null / number / string for credential fields
 * before the tenant has saved WhatsApp settings.
 */
const optionalCredentialText = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return "";
    return String(value).trim();
  });

const nullableTextish = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const text = String(value).trim();
    return text === "" ? null : text;
  });

export const whatsAppSettingsDtoSchema = z.object({
  id: z.coerce.number(),
  access_token: optionalCredentialText,
  pnno_id: optionalCredentialText,
  waba_id: optionalCredentialText,
  webhook_url: nullableTextish,
  verify_token: nullableTextish,
  is_default: boolish
    .nullable()
    .optional()
    .transform((value) => value ?? false),
  updated_by: z.coerce.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const whatsAppSettingsUpdateInputSchema = z.object({
  accessToken: z.string().trim().min(1, { message: "Access token is required" }),
  phoneNumberId: z
    .string()
    .trim()
    .min(1, { message: "Phone number ID is required" }),
  wabaId: z.string().trim().min(1, { message: "WABA ID is required" }),
  webhookUrl: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine(
      (value) =>
        value == null || value === "" || /^https?:\/\/.+/i.test(value),
      { message: "Webhook URL must be a valid http(s) URL" },
    ),
  verifyToken: z.string().trim().nullable().optional(),
  isDefault: z.boolean(),
});

export type WhatsAppSettingsUpdateInputParsed = z.infer<
  typeof whatsAppSettingsUpdateInputSchema
>;
