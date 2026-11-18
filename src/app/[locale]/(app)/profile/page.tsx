import { getAuthSession } from "@/lib/auth/session";
import { ProfileView } from "@/features/account/profile";

export default async function Page() {
  const session = await getAuthSession();
  return <ProfileView user={session?.user ?? null} />;
}
