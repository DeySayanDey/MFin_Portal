import { getTranslations } from "next-intl/server";
import { GeneralSettingsView } from "@/features/master/general-settings";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("master.generalSettings");
  return { title: t("title"), description: t("description") };
}

export default async function Page() {
  const user = await getSessionUser();
  return <GeneralSettingsView canEdit={user?.isHead ?? false} />;
}
