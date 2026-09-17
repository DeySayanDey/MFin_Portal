"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { authFieldClass } from "@/components/auth/AuthShell";

const branches = [
  "Kolkata Shyambazar Hub Branch (BR-WB01)",
  "Sonarpur Branch",
  "Barasat Branch",
  "Halisahar Branch",
  "Karveer Rural Branch",
];

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      router.push("/");
    }, 450);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-slate-700">
          Employee ID / Email
        </span>
        <input
          type="text"
          name="username"
          required
          autoComplete="username"
          defaultValue="bm.shyambazar@ezimicro.in"
          placeholder="emp.id@ezimicro.in"
          className={authFieldClass}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-slate-700">Password</span>
        <span className="relative block">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            defaultValue="••••••••"
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
          Login Branch
        </span>
        <select name="branch" className={authFieldClass} defaultValue={branches[0]}>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="inline-flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-border text-brand focus:ring-brand/30"
          />
          Remember this device
        </label>
        <Link
          href="/forgot-password"
          className="font-semibold text-accent-blue hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full justify-center py-3"
      >
        <LogIn className="h-4 w-4" />
        {submitting ? "Signing in…" : "Sign In to Core Banking"}
      </button>

      <p className="text-center text-sm text-muted">
        New staff user?{" "}
        <Link href="/register" className="font-semibold text-brand-ink hover:underline">
          Register account
        </Link>
      </p>
    </form>
  );
}
