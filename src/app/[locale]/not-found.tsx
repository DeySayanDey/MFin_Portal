import { getTranslations } from "next-intl/server";
import { NotFoundScreen } from "@/components/shared/NotFoundScreen";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFoundPage");

  return (
    <NotFoundScreen
      title={t("title")}
      message={t("message")}
      homeLabel={t("home")}
    />
  );
}
