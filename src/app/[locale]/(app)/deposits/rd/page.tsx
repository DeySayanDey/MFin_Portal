import { DepositsRdView } from "@/features/deposits/components/DepositsRdView";

export const metadata = {
  title: "Recurring Deposits · eZi-Micro Core Banking",
  description: "RD installment accounts with maturity tracking",
};

export default function Page() {
  return <DepositsRdView />;
}
