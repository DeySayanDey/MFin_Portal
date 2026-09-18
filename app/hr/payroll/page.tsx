import type { Metadata } from "next";
import { Suspense } from "react";
import { HrPayrollPageClient } from "@/components/hr/HrPayrollPageClient";

export const metadata: Metadata = {
  title: "Monthly Staff Payroll · eZi-Micro Core Banking",
  description: "Salary processing, incentives, and GL disbursal",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading…</div>}>
      <HrPayrollPageClient />
    </Suspense>
  );
}
