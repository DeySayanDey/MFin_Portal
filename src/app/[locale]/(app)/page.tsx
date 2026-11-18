import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { EXECUTIVE_DASHBOARD_ROUTE } from "@/features/navigation/utils/menu-route-fallbacks";

export default async function HomePage() {
  redirect({
    href: EXECUTIVE_DASHBOARD_ROUTE,
    locale: await getLocale(),
  });
}
