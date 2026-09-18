import { DepositsFdView } from "@/components/deposits/DepositsFdView";

export const metadata = {
  title: "Fixed Deposits · eZi-Micro Core Banking",
  description: "Term deposits with maturity and lien support",
};

export default function Page() {
  return <DepositsFdView />;
}
