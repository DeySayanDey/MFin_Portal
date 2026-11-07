import { getTranslations } from "next-intl/server";
import { LosApplicationsView } from "@/features/los/components/LosApplicationsView";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("los.applications");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function Page() {
  const user = await getSessionUser();

  return (
    <LosApplicationsView
      isHead={user?.isHead ?? false}
      branchId={user?.branchId ?? null}
      branchName={user?.branchName ?? ""}
    />
  );
}
