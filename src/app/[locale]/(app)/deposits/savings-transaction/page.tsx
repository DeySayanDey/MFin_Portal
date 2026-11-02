import { getTranslations } from "next-intl/server";
import { SavingsTransactionView } from "@/features/deposits/savings-transaction/components/SavingsTransactionView";

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
  const query = await searchParams;
  const raw = query.account_id;
  const id = Number(Array.isArray(raw) ? raw[0] : raw);
  return (
    <SavingsTransactionView
      key={Number.isInteger(id) && id > 0 ? id : "all"}
      initialAccountId={Number.isInteger(id) && id > 0 ? id : null}
    />
  );
}
