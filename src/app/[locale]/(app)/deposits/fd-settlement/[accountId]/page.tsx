import { getTranslations } from "next-intl/server";
import { FdSettlementAccountView } from "@/features/deposits/fd-settlement/components/FdSettlementAccountView";

export async function generateMetadata() {
  const t = await getTranslations("deposits.fdSettlement");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type PageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { accountId } = await params;
  return <FdSettlementAccountView accountId={accountId} />;
}
