import { getTranslations } from "next-intl/server";
import { LosApprovalView } from "@/features/los/components/LosApprovalView";

export async function generateMetadata() {
  const t = await getTranslations("loanModule.screens.approval");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return <LosApprovalView />;
}
