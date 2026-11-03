import { getTranslations } from "next-intl/server";
import { DepositAccountOpenPage } from "@/features/deposits/savings/components/DepositAccountOpenPage";
import { TERM_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";

export async function generateMetadata() {
  const t = await getTranslations("deposits");
  return {
    title: t("savings.form.term.createTitle"),
    description: t("term.metaDescription"),
  };
}

export default function Page() {
  return <DepositAccountOpenPage depositTypeCd={TERM_DEPOSIT_TYPE} />;
}
