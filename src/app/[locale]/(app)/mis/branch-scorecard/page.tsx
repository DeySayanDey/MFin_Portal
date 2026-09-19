import { MisBranchScorecardView } from "@/features/mis/components/MisBranchScorecardView";

export const metadata = {
  title: "Branch Scorecard · eZi-Micro Core Banking",
  description: "Ranked branch performance on AUM, efficiency, PAR and NPA",
};

export default function Page() {
  return <MisBranchScorecardView />;
}
