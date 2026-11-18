import { DepositsWithdrawalsView } from "@/features/deposits/components/DepositsWithdrawalsView";

export const metadata = {
  title: "Withdrawal Requests · eZi-Micro Core Banking",
  description: "Emergency and premature withdrawal request queue",
};

export default function Page() {
  return <DepositsWithdrawalsView />;
}
