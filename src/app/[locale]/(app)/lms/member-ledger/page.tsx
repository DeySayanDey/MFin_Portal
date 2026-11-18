import { getTranslations } from "next-intl/server";
import { LoanScreenView } from "@/features/loan/components/LoanScreenView";

export async function generateMetadata() {
  const t = await getTranslations("loanModule.screens.memberLedger");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return <LoanScreenView screen="memberLedger" />;
}
