import { MisCollectionView } from "@/components/mis/MisCollectionView";

export const metadata = {
  title: "Collection Register · eZi-Micro Core Banking",
  description: "Daily collection receipts with agent and mode attribution",
};

export default function Page() {
  return <MisCollectionView />;
}
