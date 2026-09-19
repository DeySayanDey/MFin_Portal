import { DepositsFdView } from "@/features/deposits/components/DepositsFdView";

export const metadata = {
  title: "Fixed Deposits · eZi-Micro Core Banking",
  description: "Term deposits with maturity and lien support",
};

export default function Page() {
  return <DepositsFdView />;
}
