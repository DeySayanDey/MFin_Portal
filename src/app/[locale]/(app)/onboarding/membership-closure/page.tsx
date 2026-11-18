import { MembershipClosureView } from "@/features/onboarding/membership-closure";

export const metadata = {
  title: "Membership Closure",
  description: "Check a member's open items and close the membership or record a death",
};

export default function Page() {
  return <MembershipClosureView />;
}
