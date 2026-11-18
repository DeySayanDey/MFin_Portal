import { getTranslations } from "next-intl/server";
import { ShareSubscriptionView } from "@/features/onboarding/share-subscription";

export async function generateMetadata() {
  const t = await getTranslations("onboarding.shareSubscription");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Page() {
  return <ShareSubscriptionView />;
}
