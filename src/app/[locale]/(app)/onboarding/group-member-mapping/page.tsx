import { Suspense } from "react";
import { GroupMemberMappingView } from "@/features/onboarding/group-member-mapping";

export default function Page() {
  return (
    <Suspense>
      <GroupMemberMappingView />
    </Suspense>
  );
}
