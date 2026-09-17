"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import { authFieldClass } from "@/components/auth/AuthShell";

type Step = "request" | "otp" | "reset" | "done";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("bm.shyambazar@ezimicro.in");
  const [submitting, setSubmitting] = useState(false);

  function goNext(next: Step) {
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setStep(next);
    }, 400);
  }

  return (
    <div className="space-y-4">
      {step === "request" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            goNext("otp");
          }}
          className="space-y-4"
        >
          <p className="text-sm leading-6 text-muted">
            Enter your registered employee email or Emp ID. We will send a
            one-time verification code to reset your portal password.
          </p>
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
            disabled={submitting}
            className="btn btn-primary w-full justify-center py-3"
          >
            <MailCheck className="h-4 w-4" />
            {submitting ? "Sending…" : "Send Reset OTP"}
          </button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            goNext("reset");
          }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-sm text-blue-800">
            OTP sent to <strong>{email}</strong> via SMS & WhatsApp gateway.
            Valid for 10 minutes.
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              Enter 6-digit OTP
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="••••••"
              className={authFieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full justify-center py-3"
          >
            Verify OTP
          </button>
          <button
            type="button"
            className="btn btn-secondary w-full justify-center"
            onClick={() => setStep("request")}
          >
            Change email
          </button>
        </form>
      ) : null}

      {step === "reset" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            goNext("done");
          }}
          className="space-y-4"
        >
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              New Password
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={authFieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              Confirm New Password
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={authFieldClass}
            />
          </label>
          <div className="rounded-xl border border-border bg-surface-muted/70 px-3.5 py-3 text-xs leading-5 text-muted">
            Ensure your password complies with RBI 2026 Core Banking Security
            Guidelines. High-value approvals may still require 2FA TOTP.
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full justify-center py-3"
          >
            <KeyRound className="h-4 w-4" />
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">
              Password updated successfully
            </p>
            <p className="mt-1 text-sm text-muted">
              You can now sign in with your new credentials. Audit event logged
              for this reset.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary w-full justify-center py-3">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      ) : null}

      {step !== "done" ? (
        <p className="text-center text-sm text-muted">
          Remembered your password?{" "}
          <Link href="/login" className="font-semibold text-brand-ink hover:underline">
            Sign in
          </Link>
        </p>
      ) : null}
    </div>
  );
}
