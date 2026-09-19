import { MisExportsView } from "@/features/mis/components/MisExportsView";

export const metadata = {
  title: "Scheduled Exports · eZi-Micro Core Banking",
  description: "MIS, CIC, and RBI regulatory export packs",
};

export default function Page() {
  return <MisExportsView />;
}
