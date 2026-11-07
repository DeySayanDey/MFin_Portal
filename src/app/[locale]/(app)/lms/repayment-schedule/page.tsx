import { getTranslations } from "next-intl/server";
import { LmsRepaymentScheduleView } from "@/features/lms/repayment-schedule";

export async function generateMetadata() {
  const t = await getTranslations("loanModule.screens.repaymentSchedule");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return <LmsRepaymentScheduleView />;
}
