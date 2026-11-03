import { getTranslations } from "next-intl/server";
import { DepositAccountEditPage } from "@/features/deposits/savings/components/DepositAccountEditPage";
import { resolveDepositAccountRef } from "@/features/deposits/savings/services/deposit-account.service";
import { readRecordCode, recordPath } from "@/lib/navigation/record-code";
import { resolveRecordPage } from "@/lib/navigation/record-page";

export async function generateMetadata() {
  const t = await getTranslations("deposits.savings");
  return {
    title: t("form.editTitle"),
    description: t("metaDescription"),
  };
}

type PageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { accountId: code } = await params;
  const id = await resolveRecordPage({
    code,
    resolve: resolveDepositAccountRef,
    href: (value) => recordPath("/deposits/savings", value, "/edit"),
  });
  return (
    <DepositAccountEditPage
      accountId={id ?? 0}
      detailHref={id ? recordPath("/deposits/savings", readRecordCode(code) ?? "") : "/deposits/savings"}
    />
  );
}
