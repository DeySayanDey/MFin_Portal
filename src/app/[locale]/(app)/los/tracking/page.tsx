import { getTranslations } from "next-intl/server";
import { LosTrackingView } from "@/features/los/components/LosTrackingView";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("loanModule.screens.tracking");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page() {
  const user = await getSessionUser();

  return (
    <LosTrackingView
      isHead={user?.isHead ?? false}
      branchId={user?.branchId ?? null}
      branchName={user?.branchName ?? ""}
    />
  );
}
