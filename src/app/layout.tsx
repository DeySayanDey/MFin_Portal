import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { THEME_BOOT_SCRIPT, THEME_COOKIE, isThemeMode } from "@/features/theme/theme";
import { MENU_BOOT_SCRIPT } from "@/features/navigation/utils/menu-boot-script";
import { FormErrorFocus } from "@/components/shared/FormErrorFocus";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/PrioSuite_Favicon_Pack/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/PrioSuite_Favicon_Pack/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/PrioSuite_Favicon_Pack/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/PrioSuite_Favicon_Pack/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/PrioSuite_Favicon_Pack/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/PrioSuite_Favicon_Pack/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

type RootLayoutProps = {
  children: ReactNode;
};

/**
 * Next.js requires <html> and <body> in the root layout.
 * Locale is resolved via next-intl for the lang attribute.
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const cookieStore = await cookies();
  const storedTheme = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isThemeMode(storedTheme) ? storedTheme : "light";

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${theme === "dark" ? " dark" : ""}`}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <FormErrorFocus />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <Script
          id="mfin-menu-boot-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: MENU_BOOT_SCRIPT }}
        />
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
