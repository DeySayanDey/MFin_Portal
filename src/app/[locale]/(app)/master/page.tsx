import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function Page() {
  redirect({
    href: "/master/company-profile",
    locale: await getLocale(),
  });
}
