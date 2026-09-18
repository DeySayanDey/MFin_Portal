import { HrTransfersPayrollEngine } from "@/components/hr/HrTransfersPayrollEngine";

export const metadata = {
  title: "Member Transfers · eZi-Micro Core Banking",
  description: "Borrower Kendra and branch transfer orders",
};

export default function Page() {
  return <HrTransfersPayrollEngine activeTab="member" />;
}
