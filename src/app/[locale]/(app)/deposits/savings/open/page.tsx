import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function Page() {
  redirect({ href: "/deposits/savings/new", locale: await getLocale() });
}
