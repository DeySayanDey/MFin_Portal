import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { AppShell } from "@/components/layout/AppShell";
import { getAuthSession } from "@/lib/auth/session";
import { redirect } from "@/i18n/navigation";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getAuthSession();
  if (!session) {
    redirect({
      href: "/login",
      locale: await getLocale(),
    });
    return null;
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
