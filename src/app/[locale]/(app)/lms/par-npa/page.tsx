import { LmsParNpaView } from "@/features/lms/components/LmsParNpaView";

export const metadata = {
  title: "PAR / NPA Monitor · eZi-Micro Core Banking",
  description: "Portfolio-at-risk aging and NPA classification monitor",
};

export default function Page() {
  return <LmsParNpaView />;
}
