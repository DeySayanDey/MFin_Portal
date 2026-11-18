import { getLocale, getTranslations } from "next-intl/server";
import { DepositsSavingsView } from "@/features/deposits/components/DepositsSavingsView";
import { savingsFiltersFromQuery } from "@/features/deposits/savings/savings-filters";
import { resolveDepositAccountRef } from "@/features/deposits/savings/services/deposit-account.service";
import { recordPath } from "@/lib/navigation/record-code";
import { resolveRecordPage } from "@/lib/navigation/record-page";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("deposits.savings");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const detailHref = (code: string) => recordPath("/deposits/savings", code);
  const accountId = params.account_id
    ? await resolveRecordPage({
        code: params.account_id,
        resolve: resolveDepositAccountRef,
        href: detailHref,
      })
    : null;
  if (accountId) {
    redirect({ href: detailHref(String(accountId)), locale: await getLocale() });
  }

  const user = await getSessionUser();
  const pageRaw = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Number(pageRaw);

  return (
    <DepositsSavingsView
      isHead={user?.isHead ?? false}
      branchId={user?.branchId ?? null}
      branchName={user?.branchName ?? ""}
      initialFilters={savingsFiltersFromQuery(params)}
      initialPage={Number.isFinite(page) && page > 0 ? page : 1}
    />
  );
}
