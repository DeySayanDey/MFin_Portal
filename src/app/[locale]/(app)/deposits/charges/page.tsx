import { getTranslations } from "next-intl/server";
import { ChargePostingView } from "@/features/deposits/charge-posting/components/ChargePostingView";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("deposits.chargePosting");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function Page() {
  const user = await getSessionUser();
  return <ChargePostingView canPickBranch={user?.isHead ?? false} />;
}
