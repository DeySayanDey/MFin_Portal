import { ChargesSetupView } from "@/features/master/charges-setup";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <ChargesSetupView initialTab={params.tab} />;
}
