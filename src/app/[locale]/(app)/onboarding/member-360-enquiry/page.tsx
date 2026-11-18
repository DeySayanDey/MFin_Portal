import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Member360View } from "@/features/onboarding/member-360/components/Member360View";

export async function generateMetadata() {
  const t = await getTranslations("onboarding.member360");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Member360View />
    </Suspense>
  );
}
