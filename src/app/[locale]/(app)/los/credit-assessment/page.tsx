import { getTranslations } from "next-intl/server";
import { LosCreditAssessmentView } from "@/features/los/components/LosCreditAssessmentView";

export async function generateMetadata() {
  const t = await getTranslations("loanModule.screens.creditAssessment");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return <LosCreditAssessmentView />;
}
