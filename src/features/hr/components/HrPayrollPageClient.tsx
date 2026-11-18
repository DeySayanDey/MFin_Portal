"use client";

import { useSearchParams } from "next/navigation";
import { HrTransfersPayrollEngine } from "@/features/hr/components/HrTransfersPayrollEngine";

export function HrPayrollPageClient() {
  const params = useSearchParams();
  const tab = params.get("tab") === "banking" ? "banking" : "payroll";
  return <HrTransfersPayrollEngine activeTab={tab} />;
}
