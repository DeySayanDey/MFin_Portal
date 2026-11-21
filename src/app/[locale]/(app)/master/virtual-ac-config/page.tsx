import { getTranslations } from "next-intl/server";
import { VirtualAccountConfigForm } from "@/features/master/virtual-ac-config/components/VirtualAccountConfigForm";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("virtualAccountConfig");
  return { title: t("title") };
}

export default async function Page() {
  const user = await getSessionUser();
  return <VirtualAccountConfigForm canEdit={Boolean(user?.isHead || user?.isAdmin)} />;
}
