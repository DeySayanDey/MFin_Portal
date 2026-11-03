import { getTranslations } from "next-intl/server";
import { InterestPostingView } from "@/features/deposits/interest-posting/components/InterestPostingView";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("deposits.interestPosting");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function Page() {
  const user = await getSessionUser();
  return <InterestPostingView canPickBranch={user?.isHead ?? false} />;
}
