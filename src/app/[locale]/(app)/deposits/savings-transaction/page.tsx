import { getTranslations } from "next-intl/server";
import { SavingsTransactionView } from "@/features/deposits/savings-transaction/components/SavingsTransactionView";
import { resolveDepositAccountRef } from "@/features/deposits/savings/services/deposit-account.service";
import { getSessionUser } from "@/lib/auth/session";
import { resolveRecordPage } from "@/lib/navigation/record-page";

export async function generateMetadata() {
  const t = await getTranslations("deposits.savingsTransaction");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const { account, account_id: legacyAccount, ...rest } = await searchParams;
  const code = account ?? legacyAccount;
  const id = code
    ? await resolveRecordPage({
        code,
        resolve: resolveDepositAccountRef,
        href: (value) => `/deposits/savings-transaction?${new URLSearchParams({ account: value })}`,
        keep: rest,
      })
    : null;
  const user = await getSessionUser();
  return (
    <SavingsTransactionView
      key={id ?? "all"}
      initialAccountId={id}
      reportContext={{
        orgName: user?.legalName || user?.orgDisplayName || "",
        branchName: user?.branchName ?? "",
        branchCode: user?.branchCode ?? "",
        printedBy: user?.userName ?? "",
      }}
    />
  );
}
