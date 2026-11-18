import { z } from "zod";

const boolish = z
  .union([z.boolean(), z.literal(0), z.literal(1), z.literal("0"), z.literal("1")])
  .transform((value) => value === true || value === 1 || value === "1");

export const globalSettingsDtoSchema = z.object({
  default_language: z.string(),
  allow_backdated_txn: boolish,
  max_backdate_days: z.coerce.number().int(),
  day_end_required: boolish,
  month_end_required: boolish,
  year_end_required: boolish,
  pan_required: boolish,
  aadhaar_required: boolish,
  voter_id_required: boolish,
  geo_tagging_required: boolish,
  updated_by_name: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export const globalSettingsUpdateInputSchema = z
  .object({
    defaultLanguage: z.enum(["en", "bn", "hi", "or"]),
    passwordExpiryDays: z
      .number()
      .int("Enter whole days")
      .min(0, "Use 0 for no expiry")
      .max(365, "Password expiry can be at most 365 days"),
    loginAttemptLimit: z
      .number()
      .int("Enter a whole number")
      .min(1, "Allow at least 1 attempt")
      .max(20, "Login attempt limit can be at most 20"),
    allowBackdatedTxn: z.boolean(),
    maxBackdateDays: z
      .number()
      .int("Enter whole days")
      .min(0)
      .max(365, "Maximum backdate days can be at most 365"),
    dayEndRequired: z.boolean(),
    monthEndRequired: z.boolean(),
    yearEndRequired: z.boolean(),
    panRequired: z.boolean(),
    aadhaarRequired: z.boolean(),
    voterIdRequired: z.boolean(),
    geoTaggingRequired: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.allowBackdatedTxn && value.maxBackdateDays < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["maxBackdateDays"],
        message: "Enter at least 1 day when backdated transactions are allowed",
      });
    }
  });

export type GlobalSettingsUpdateInputParsed = z.infer<typeof globalSettingsUpdateInputSchema>;
