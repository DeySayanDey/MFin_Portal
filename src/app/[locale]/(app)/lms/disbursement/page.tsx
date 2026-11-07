import { getTranslations } from "next-intl/server";
import { LmsDisbursementView } from "@/features/lms/disbursement/components/LmsDisbursementView";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("loanModule.screens.disbursement");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page() {
  const user = await getSessionUser();

  return (
    <LmsDisbursementView
      isHead={user?.isHead ?? false}
      branchId={user?.branchId ?? null}
      branchName={user?.branchName ?? ""}
    />
  );
}
