import { AccountLedgerSetupView } from "@/features/master/components/AccountLedgerSetupView";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <AccountLedgerSetupView initialTab={params.tab ?? "categories"} />;
}
