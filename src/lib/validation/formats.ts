import { z } from "zod";

/** Indian individual PAN: AAAAA9999A */
export const panPattern = /^[A-Z]{5}\d{4}[A-Z]$/;

/** Indian TAN: AAAA99999A */
export const tanPattern = /^[A-Z]{4}\d{5}[A-Z]$/;

/** GSTIN: 15 characters */
export const gstinPattern = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** CIN: 21 characters */
export const cinPattern = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

/** Indian mobile without country code */
export const mobilePattern = /^[6-9]\d{9}$/;

/** Aadhaar: 12 digits */
export const aadhaarPattern = /^\d{12}$/;

/** Phone or landline, optional leading + */
export const phonePattern = /^\+?\d{6,15}$/;

const websitePattern = /^https?:\/\/\S+$/i;

/** Show a format error once the value is complete, or when the user leaves the field. */
export function formatIssue(
  value: string,
  final: boolean,
  exact: number,
  pattern: RegExp,
  message: string,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!final && trimmed.length < exact) return undefined;
  return pattern.test(trimmed) ? undefined : message;
}

export function normalizeMobile(value: string): string {
  const compact = value.replace(/[\s-]/g, "");
  if (compact.startsWith("+91")) return compact.slice(3);
  if (compact.startsWith("91") && compact.length === 12) return compact.slice(2);
  return compact;
}

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, "");
}

function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Empty, null, or a trimmed string within `max`. */
export function optionalText(max: number) {
  return z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => blankToNull(value ?? null))
    .refine((value) => value == null || value.length <= max);
}

/** Empty or a value that matches after `normalize`. */
export function optionalFormatted(
  max: number,
  pattern: RegExp,
  normalize: (value: string) => string = (value) => value.trim().toUpperCase(),
) {
  return z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      const blank = blankToNull(value ?? null);
      return blank == null ? null : normalize(blank);
    })
    .refine(
      (value) => value == null || (value.length <= max && pattern.test(value)),
    );
}

export function optionalEmail(max = 100) {
  return z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => blankToNull(value ?? null))
    .refine(
      (value) =>
        value == null || (value.length <= max && z.string().email().safeParse(value).success),
    );
}

export function optionalWebsite(max = 200) {
  return optionalFormatted(max, websitePattern, (value) => value.trim());
}

export function optionalPhone(max = 20) {
  return optionalFormatted(max, phonePattern, normalizePhone);
}

export function optionalMobile(max = 15) {
  return optionalFormatted(max, mobilePattern, normalizeMobile);
}

export function optionalPan() {
  return optionalFormatted(10, panPattern);
}

export function optionalAadhaar() {
  return optionalFormatted(12, aadhaarPattern, (value) => value.replace(/\s/g, ""));
}
