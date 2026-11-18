import { Suspense } from "react";
import { CustomerKycView } from "@/features/customer-kyc/components/CustomerKycView";
import { PageListSkeleton } from "@/components/shared/skeletons/PageListSkeleton";

export default function Page() {
  return (
    <Suspense fallback={<PageListSkeleton tabs={4} tableColumns={6} />}>
      <CustomerKycView />
    </Suspense>
  );
}
