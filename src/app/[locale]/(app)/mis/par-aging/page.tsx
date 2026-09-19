import { MisParAgingView } from "@/features/mis/components/MisParAgingView";

export const metadata = {
  title: "PAR Aging · eZi-Micro Core Banking",
  description: "Portfolio-at-risk aging buckets with IRAC provisioning",
};

export default function Page() {
  return <MisParAgingView />;
}
