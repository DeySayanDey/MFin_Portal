import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In · eZi-Micro Core Banking",
  description: "Secure staff login to eZi-Micro MFIN Core Banking Portal",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to Core Banking"
      subtitle="Use your employee credentials and assigned branch to continue."
    >
      <LoginForm />
    </AuthShell>
  );
}
