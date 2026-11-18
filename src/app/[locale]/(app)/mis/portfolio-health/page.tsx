import { MisPortfolioHealthView } from "@/features/mis/components/MisPortfolioHealthView";

export const metadata = {
  title: "Portfolio Health · eZi-Micro Core Banking",
  description: "AUM quality, efficiency, and PAR concentration monitor",
};

export default function Page() {
  return <MisPortfolioHealthView />;
}
