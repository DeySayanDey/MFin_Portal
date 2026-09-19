import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata = {
  title: "Sign In · eZi-Micro Core Banking",
  description: "Secure staff login to eZi-Micro MFIN Core Banking Portal",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to Core Banking"
      subtitle="Use your user code or username and password to continue."
    >
      <LoginForm />
    </AuthShell>
  );
}
