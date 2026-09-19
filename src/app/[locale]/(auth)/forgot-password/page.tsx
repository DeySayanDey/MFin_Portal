import { AuthShell } from "@/features/auth/components/AuthShell";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password · eZi-Micro Core Banking",
  description: "Reset eZi-Micro portal password with OTP verification",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset portal password"
      subtitle="Verify your employee identity with OTP before setting a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
