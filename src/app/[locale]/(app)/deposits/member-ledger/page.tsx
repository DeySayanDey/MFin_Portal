import { getTranslations } from "next-intl/server";
import { DepositsMemberLedgerView } from "@/features/deposits/components/DepositsMemberLedgerView";

export async function generateMetadata() {
  const t = await getTranslations("deposits.memberLedger");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function Page() {
  return <DepositsMemberLedgerView />;
}
