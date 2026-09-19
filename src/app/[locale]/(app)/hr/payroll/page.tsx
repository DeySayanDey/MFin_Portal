import type { Metadata } from "next";
import { Suspense } from "react";
import { HrPayrollPageClient } from "@/features/hr/components/HrPayrollPageClient";
import { PageListSkeleton } from "@/components/shared/skeletons/PageListSkeleton";

export const metadata: Metadata = {
  title: "Monthly Staff Payroll · eZi-Micro Core Banking",
  description: "Salary processing, incentives, and GL disbursal",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="page-transition page-transition--loading">
          <PageListSkeleton />
        </div>
      }
    >
      <HrPayrollPageClient />
    </Suspense>
  );
}
