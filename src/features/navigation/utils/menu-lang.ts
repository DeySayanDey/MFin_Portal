import type { AppLocale } from "@/i18n/routing";
import { isAppLocale, routing } from "@/i18n/routing";

/**
 * Laravel MenuTree `lang` query (e.g. HI, EN, BN, OR).
 * Maps next-intl locale → uppercase API code.
 */
export function toMenuLang(locale: string | null | undefined): string {
  const normalized = (locale ?? routing.defaultLocale).trim().toLowerCase();
  const appLocale: AppLocale = isAppLocale(normalized)
    ? normalized
    : routing.defaultLocale;
  return appLocale.toUpperCase();
}

/** Accept Laravel `lang` or app locale; return a safe uppercase code. */
export function normalizeMenuLang(raw: string | null | undefined): string {
  if (raw == null || raw.trim() === "") {
    return toMenuLang(routing.defaultLocale);
  }
  const trimmed = raw.trim();
  if (/^[a-zA-Z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return toMenuLang(trimmed);
}
