import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function Page() {
  redirect({
    href: "/hr/staff",
    locale: await getLocale(),
  });
}
