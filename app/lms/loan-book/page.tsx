import { LmsLoanBookView } from "@/components/lms/LmsLoanBookView";

export const metadata = {
  title: "Active Loan Book · eZi-Micro Core Banking",
  description: "Portfolio balances, collections, rates, and DPD register",
};

export default function Page() {
  return <LmsLoanBookView />;
}
