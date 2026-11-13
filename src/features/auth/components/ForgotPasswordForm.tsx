"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, KeyRound } from "lucide-react";
import { AuthLanguageSelect } from "@/features/auth/components/AuthShell";
import { forgotPasswordFormSchema } from "@/features/auth/schemas/auth-form.schema";
import { Alert } from "@/components/ui/Alert";
import { TextField } from "@/components/ui/Form";
import { Link } from "@/i18n/navigation";

/**
 * UI-only forgot-password screen.
 * No Laravel reset API is documented yet — do not simulate OTP/API success.
 */
export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [identifier, setIdentifier] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordFormSchema.safeParse({ identifier });
    if (!parsed.success) {
      setFieldError(t("errors.identifier"));
      return;
    }
    setFieldError(undefined);
  }

  return (
    <div className="space-y-4">
      <AuthLanguageSelect />

      <form autoComplete="off" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm leading-6 text-slate-500">{t("forgotHint")}</p>

        <Alert tone="warning">{t("forgotPendingApi")}</Alert>

        <TextField
          label={t("forgotIdentifier")}
          required
          value={identifier}
          error={fieldError}
          onChange={setIdentifier}
        />

        <button
          type="submit"
          className="btn btn-primary w-full justify-center py-3"
        >
          <KeyRound className="h-4 w-4" />
          {t("sendReset")}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {t("rememberedPassword")}{" "}
        <Link href="/login" className="font-semibold text-brand-ink hover:underline">
          {t("signIn")}
        </Link>
      </p>

      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-brand-ink hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToSignIn")}
      </Link>
    </div>
  );
}
