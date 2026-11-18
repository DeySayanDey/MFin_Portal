import { LoanSchemesView } from "@/features/master/loan-schemes";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <LoanSchemesView initialTab={params.tab ?? "setup"} />;
}
