import { getTranslations } from "next-intl/server";
import { DepositsSavingsView } from "@/features/deposits/components/DepositsSavingsView";
import { TERM_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { savingsFiltersFromQuery } from "@/features/deposits/savings/savings-filters";
import { getSessionUser } from "@/lib/auth/session";

export async function generateMetadata() {
  const t = await getTranslations("deposits.term");
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
  const t = await getTranslations("deposits.savings");
  const user = await getSessionUser();
  const pageRaw = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Number(pageRaw);
  const accountRaw = Array.isArray(params.account_id)
    ? params.account_id[0]
    : params.account_id;
  const accountId = Number(accountRaw);
  const createdRaw = Array.isArray(params.created) ? params.created[0] : params.created;
  const createdToneRaw = Array.isArray(params.createdTone)
    ? params.createdTone[0]
    : params.createdTone;
  const created = createdRaw?.trim() ?? "";
  const updatedRaw = Array.isArray(params.updated) ? params.updated[0] : params.updated;
  const updated = updatedRaw?.trim() ?? "";

  return (
    <DepositsSavingsView
      isHead={user?.isHead ?? false}
      branchId={user?.branchId ?? null}
      branchName={user?.branchName ?? ""}
      initialFilters={savingsFiltersFromQuery(params)}
      initialPage={Number.isFinite(page) && page > 0 ? page : 1}
      initialAccountId={Number.isFinite(accountId) && accountId > 0 ? accountId : null}
      depositTypeCd={TERM_DEPOSIT_TYPE}
      variant="term"
      initialNotice={
        created
          ? {
              message:
                createdToneRaw === "error"
                  ? created
                  : t("toast.created", { applNo: created }),
              tone: createdToneRaw === "error" ? "error" : "success",
            }
          : updated
            ? {
                message: t("toast.updated", { applNo: updated }),
                tone: "success",
              }
            : null
      }
    />
  );
}
