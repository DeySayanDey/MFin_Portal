import { DepositSchemesView } from "@/features/master/deposit-schemes";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <DepositSchemesView initialTab={params.tab ?? "setup"} />;
}
