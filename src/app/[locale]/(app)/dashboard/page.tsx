import { getTranslations } from "next-intl/server";
import { DashboardView } from "@/features/dashboard/components/DashboardView";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function Page() {
  const user = await getSessionUser();
  return <DashboardView canPickBranch={user?.isHead ?? false} />;
}
