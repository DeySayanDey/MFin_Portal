import { getTranslations } from "next-intl/server";
import { FdSettlementView } from "@/features/deposits/fd-settlement/components/FdSettlementView";

export async function generateMetadata() {
  const t = await getTranslations("deposits.fdSettlement");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function Page() {
  return <FdSettlementView />;
}
