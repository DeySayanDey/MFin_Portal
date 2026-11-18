import { AccountingCoaView } from "@/features/accounting/components/AccountingViews";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <AccountingCoaView initialTab={params.tab ?? "categories"} />;
}
