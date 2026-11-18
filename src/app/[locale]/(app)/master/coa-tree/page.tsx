import { CoaTreeView } from "@/features/master/components/CoaTreeView";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <CoaTreeView initialTab={params.tab ?? "categories"} />;
}
