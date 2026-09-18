import { LmsRepaymentScheduleView } from "@/components/lms/LmsRepaymentScheduleView";

export const metadata = {
  title: "Repayment Schedule · eZi-Micro Core Banking",
  description: "EMI amortization calendar and reducing-balance schedule",
};

export default function Page() {
  return <LmsRepaymentScheduleView />;
}
