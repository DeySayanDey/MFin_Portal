import { getTranslations } from "next-intl/server";
import { LosFieldVerificationView } from "@/features/los/components/LosFieldVerificationView";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("loanModule.screens.fieldVerification");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page() {
  const user = await getSessionUser();

  return (
    <LosFieldVerificationView
      isHead={user?.isHead ?? false}
      branchId={user?.branchId ?? null}
      branchName={user?.branchName ?? ""}
    />
  );
}
