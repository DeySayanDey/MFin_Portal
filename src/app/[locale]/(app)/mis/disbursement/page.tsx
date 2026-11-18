import { MisDisbursementView } from "@/features/mis/components/MisDisbursementView";

export const metadata = {
  title: "Disbursement Report · eZi-Micro Core Banking",
  description: "Gross vs net disbursal and NEFT payout status",
};

export default function Page() {
  return <MisDisbursementView />;
}
