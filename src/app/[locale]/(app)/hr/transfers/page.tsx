import { HrTransfersPayrollEngine } from "@/features/hr/components/HrTransfersPayrollEngine";

export const metadata = {
  title: "Employee Transfers · eZi-Micro Core Banking",
  description: "Staff posting and branch transfer orders",
};

export default function Page() {
  return <HrTransfersPayrollEngine activeTab="employee" />;
}
