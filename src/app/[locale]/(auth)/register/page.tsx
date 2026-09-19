import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata = {
  title: "Register · eZi-Micro Core Banking",
  description: "Register an authorized eZi-Micro staff account",
};

export default function RegisterPage() {
  return (
    <AuthShell
      wide
      title="Create staff account"
      subtitle="Register with your employee ID, branch mapping, and official email."
    >
      <RegisterForm />
    </AuthShell>
  );
}
