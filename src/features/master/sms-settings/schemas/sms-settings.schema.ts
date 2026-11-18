import { z } from "zod";

const boolish = z
  .union([z.boolean(), z.literal(0), z.literal(1), z.literal("0"), z.literal("1")])
  .transform((value) => value === true || value === 1 || value === "1");

/** Runtime check for SmsSettingsGet / Update response data. */
export const smsSettingsDtoSchema = z.object({
  id: z.coerce.number(),
  api_key: z.string(),
  header_key: z.string(),
  user_nm: z.string(),
  user_pwd: z.string(),
  is_default: boolish,
  updated_by: z.coerce.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

/** Domain update validation. */
export const smsSettingsUpdateInputSchema = z.object({
  apiKey: z.string().trim().min(1, { message: "API key is required" }),
  headerKey: z
    .string()
    .trim()
    .min(1, { message: "Header / sender ID is required" })
    .max(20, { message: "Header key is too long" }),
  userName: z.string().trim().min(1, { message: "Username is required" }),
  userPassword: z.string().min(1, { message: "Password is required" }),
  isDefault: z.boolean(),
});

export type SmsSettingsUpdateInputParsed = z.infer<
  typeof smsSettingsUpdateInputSchema
>;
