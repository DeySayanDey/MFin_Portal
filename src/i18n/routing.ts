import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "bn", "hi", "or"],
  defaultLocale: "en",
  // Client preference: keep language out of the URL (cookie + Accept-Language).
  localePrefix: "never",
  localeCookie: {
    // Remember preference across sessions (1 year).
    maxAge: 60 * 60 * 24 * 365,
  },
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}
