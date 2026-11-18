import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return {
    title: t("metaSignInTitle"),
    description: t("metaSignInDescription"),
  };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("welcomeBack")} subtitle={t("signInSubtitle")}>
      <LoginForm />
    </AuthShell>
  );
}
