import { getTranslations } from "next-intl/server";
import { SpecimenUpdateView } from "@/features/deposits/specimen-update/components/SpecimenUpdateView";

export async function generateMetadata() {
  const t = await getTranslations("deposits.specimenUpdate");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function Page() {
  return <SpecimenUpdateView />;
}
