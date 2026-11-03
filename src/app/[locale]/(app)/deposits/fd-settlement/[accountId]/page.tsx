import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FdSettlementAccountView } from "@/features/deposits/fd-settlement/components/FdSettlementAccountView";
import { FD_SETTLEMENT_PATH } from "@/features/deposits/fd-settlement/fd-settlement.routes";
import { resolveSettlementAccountRef } from "@/features/deposits/fd-settlement/services/fd-settlement.service";
import { readRecordCode, recordPath } from "@/lib/navigation/record-code";
import { resolveRecordPage } from "@/lib/navigation/record-page";

export async function generateMetadata() {
  const t = await getTranslations("deposits.fdSettlement");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type PageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { accountId: code } = await params;
  if (!readRecordCode(code)) notFound();
  const id = await resolveRecordPage({
    code,
    resolve: resolveSettlementAccountRef,
    href: (value) => recordPath(FD_SETTLEMENT_PATH, value),
  });
  return <FdSettlementAccountView accountId={id ?? 0} />;
}
