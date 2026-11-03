import { getTranslations } from "next-intl/server";
import { DepositAccountDetailPage } from "@/features/deposits/savings/components/DepositAccountDetailPage";
import { resolveDepositAccountRef } from "@/features/deposits/savings/services/deposit-account.service";
import { recordPath } from "@/lib/navigation/record-code";
import { resolveRecordPage } from "@/lib/navigation/record-page";

export async function generateMetadata() {
  const t = await getTranslations("deposits.savings");
  return {
    title: t("view.title"),
    description: t("metaDescription"),
  };
}

type PageProps = {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  source: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = source[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function Page({ params, searchParams }: PageProps) {
  const { accountId: code } = await params;
  const query = await searchParams;
  const id = await resolveRecordPage({
    code,
    resolve: resolveDepositAccountRef,
    href: (value) => recordPath("/deposits/savings", value),
    keep: query,
  });
  return (
    <DepositAccountDetailPage
      accountId={id ?? 0}
      notice={{
        created: readParam(query, "created"),
        updated: readParam(query, "updated"),
        openingPending: readParam(query, "opening") === "pending",
        voucherNote: readParam(query, "voucherNote"),
      }}
    />
  );
}
