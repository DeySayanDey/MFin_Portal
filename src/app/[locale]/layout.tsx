import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { THEME_COOKIE, isThemeMode } from "@/features/theme/theme";
import { isAppLocale, routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const cookieStore = await cookies();
  const storedTheme = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isThemeMode(storedTheme) ? storedTheme : "light";

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
    </NextIntlClientProvider>
  );
}
