import { DepositsMemberLedgerView } from "@/components/deposits/DepositsMemberLedgerView";

export const metadata = {
  title: "Member Deposit Ledger · eZi-Micro Core Banking",
  description: "Digital passbook with credit, debit, and interest postings",
};

export default function Page() {
  return <DepositsMemberLedgerView />;
}
