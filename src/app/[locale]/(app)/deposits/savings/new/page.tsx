import { getTranslations } from "next-intl/server";
import { DepositAccountOpenPage } from "@/features/deposits/savings/components/DepositAccountOpenPage";

export async function generateMetadata() {
  const t = await getTranslations("deposits.savings");
  return {
    title: t("form.createTitle"),
    description: t("metaDescription"),
  };
}

export default function Page() {
  return <DepositAccountOpenPage />;
}
