"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { authFieldClass } from "@/components/auth/AuthShell";

const designations = [
  "Branch Manager",
  "Field Officer",
  "Branch Accountant",
  "Credit Underwriter",
  "Cashier",
  "Super Admin",
];

const branches = [
  "Kolkata Shyambazar Hub Branch (BR-WB01)",
  "Sonarpur Branch",
  "Barasat Branch",
  "Halisahar Branch",
  "Karveer Rural Branch",
];

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) return;
    setSubmitting(true);
    window.setTimeout(() => {
      router.push("/login");
    }, 500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium text-slate-700">
            Full Name
          </span>
          <input
            type="text"
            name="fullName"
            required
            placeholder="e.g. Abhijit Bhattacharya"
            className={authFieldClass}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Employee ID
          </span>
          <input
            type="text"
            name="empId"
            required
            placeholder="EMP-WB001"
            className={authFieldClass}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Mobile Number
          </span>
          <input
            type="tel"
            name="mobile"
            required
            placeholder="+91 98XXX XXXXX"
            className={authFieldClass}
          />
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block font-medium text-slate-700">
            Official Email
          </span>
          <input
            type="email"
            name="email"
            required
            placeholder="name@ezimicro.in"
            className={authFieldClass}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Designation
          </span>
          <select name="designation" className={authFieldClass} defaultValue={designations[0]}>
            {designations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Home Branch
          </span>
          <select name="branch" className={authFieldClass} defaultValue={branches[0]}>
            {branches.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Create Password
          </span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={`${authFieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-slate-700">
            Confirm Password
          </span>
          <span className="relative block">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              className={`${authFieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-slate-700"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </span>
        </label>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
        Password must comply with RBI 2026 Core Banking Security Guidelines —
        minimum 8 characters with upper, lower, digit, and special character.
        Maker-checker activation may require Super Admin approval.
      </div>

      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
          required
        />
        I confirm this registration is for an authorized eZiMicro staff member
        mapped to a valid branch assignment.
      </label>

      <button
        type="submit"
        disabled={submitting || !accepted}
        className="btn btn-primary w-full justify-center py-3"
      >
        <UserPlus className="h-4 w-4" />
        {submitting ? "Submitting…" : "Create Staff Account"}
      </button>

      <p className="text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand-ink hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
