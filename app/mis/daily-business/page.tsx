import { MisDailyBusinessView } from "@/components/mis/MisDailyBusinessView";

export const metadata = {
  title: "Daily Business MIS · eZi-Micro Core Banking",
  description: "Daily demand, collection, AUM, PAR and vault cash MIS",
};

export default function Page() {
  return <MisDailyBusinessView />;
}
