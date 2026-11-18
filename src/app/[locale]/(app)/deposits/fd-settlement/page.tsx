import { getTranslations } from "next-intl/server";
import { FdSettlementView } from "@/features/deposits/fd-settlement/components/FdSettlementView";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("deposits.fdSettlement");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function Page() {
  const user = await getSessionUser();
  return <FdSettlementView canPickBranch={user?.isHead ?? false} />;
}
