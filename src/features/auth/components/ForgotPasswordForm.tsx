"use client";

import { useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import {
  AuthLanguageSelect,
  authFieldClass,
} from "@/features/auth/components/AuthShell";
import { Link } from "@/i18n/navigation";

/**
 * UI-only forgot-password screen.
 * No Laravel reset API is documented yet — do not simulate OTP/API success.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="space-y-4">
      <AuthLanguageSelect />

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm leading-6 text-slate-500">
          Enter your registered employee email or Emp ID. Password reset will be
          available once the Laravel API is documented.
        </p>

        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-950">
          Forgot-password API is not available yet. This page is UI-only.
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Employee Email / Emp ID
          </span>
          <input
            type="text"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authFieldClass}
          />
        </label>

        <button
          type="submit"
          disabled
          className="btn btn-primary w-full justify-center py-3"
        >
          <KeyRound className="h-4 w-4" />
          Send Reset OTP
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-brand-ink hover:underline">
          Sign in
        </Link>
      </p>

      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-brand-ink hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </Link>
    </div>
  );
}
