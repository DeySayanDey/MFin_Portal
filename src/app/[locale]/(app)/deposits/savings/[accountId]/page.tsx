import { getTranslations } from "next-intl/server";
import { DepositAccountDetailPage } from "@/features/deposits/savings/components/DepositAccountDetailPage";

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
  const { accountId } = await params;
  const query = await searchParams;
  const id = Number(accountId);
  return (
    <DepositAccountDetailPage
      accountId={Number.isInteger(id) && id > 0 ? id : 0}
      notice={{
        created: readParam(query, "created"),
        updated: readParam(query, "updated"),
        openingPending: readParam(query, "opening") === "pending",
        voucherNote: readParam(query, "voucherNote"),
      }}
    />
  );
}
