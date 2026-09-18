import { DepositsInterestView } from "@/components/deposits/DepositsInterestView";

export const metadata = {
  title: "Interest Posting · eZi-Micro Core Banking",
  description: "Monthly deposit interest accrual and GL posting",
};

export default function Page() {
  return <DepositsInterestView />;
}
