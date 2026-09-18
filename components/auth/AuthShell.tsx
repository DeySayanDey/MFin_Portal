"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  Languages,
  Lock,
  ShieldCheck,
  Vault,
} from "lucide-react";

const highlights = [
  {
    icon: Vault,
    title: "Branch Vault & Day Controls",
    body: "Dual-custody cash, day open/close, and GL 111000 reconciliation.",
  },
  {
    icon: ShieldCheck,
    title: "Maker-Checker & RBAC",
    body: "Segregation of duties with RBI-aligned dual authorization.",
  },
  {
    icon: Building2,
    title: "Multi-Branch Core Banking",
    body: "Kendra collections, any-branch service, and offline Wi-Fi sync.",
  },
];

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  wide?: boolean;
};

export function AuthShell({
  children,
  title,
  subtitle,
  wide = false,
}: AuthShellProps) {
  return (
    <div className="auth-shell flex min-h-dvh flex-col lg:flex-row">
      <aside className="auth-aside relative flex flex-col overflow-hidden px-6 py-8 text-white sm:px-8 lg:w-[46%] lg:justify-between lg:px-11 lg:py-12">
        <div className="auth-aside-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="auth-aside-glow pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative z-10">
          <Link href="/login" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-sm font-bold tracking-tight text-white shadow-[0_8px_24px_rgba(22,163,74,0.35)]">
              eZ
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">
                eZi-Micro
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
                Core Banking Portal
              </span>
            </span>
          </Link>

          <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium tracking-wide text-emerald-200/90 backdrop-blur-sm">
            <Lock className="h-3 w-3" />
            RBI 2026 · Encrypted staff session
          </div>

          <h1 className="mt-5 max-w-md text-[1.75rem] font-semibold tracking-tight text-white sm:text-[2rem] sm:leading-tight">
            Secure staff access to MFIN operations
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300/90">
            Authenticate with your employee credentials. Sessions respect
            institutional software timings and RBI Core Banking Security
            Guidelines.
          </p>

          <ul className="mt-9 hidden space-y-3 lg:block">
            {highlights.map((item) => (
              <li
                key={item.title}
                className="flex gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 backdrop-blur-[2px] transition hover:border-white/15 hover:bg-white/[0.06]"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-emerald-300 ring-1 ring-brand/25">
                  <item.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-8 text-[11px] leading-5 text-white/40 lg:mt-0">
          © {new Date().getFullYear()} eZiMicro Financial Services Ltd · Design
          & Developed By Priority Solutions
        </p>
      </aside>

      <main className="auth-main relative flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="auth-main-pattern pointer-events-none absolute inset-0" aria-hidden />
        <div
          className={`relative z-10 mx-auto w-full ${wide ? "max-w-[540px]" : "max-w-[440px]"}`}
        >
          <div className="auth-card overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_48px_-12px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
                Staff portal
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.35rem]">
                {title}
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-slate-500">{subtitle}</p>
            </div>
            <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const authFieldClass =
  "auth-field w-full appearance-none rounded-xl border border-slate-200/90 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]";

export const authSelectClass = `${authFieldClass} auth-select cursor-pointer pr-10`;

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "or", label: "Odia" },
];

export function AuthLanguageSelect() {
  return (
    <label className="auth-field-group block text-sm">
      <span className="auth-label mb-1.5 block font-medium text-slate-700">
        Language
      </span>
      <span className="relative block">
        <Languages className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          name="language"
          defaultValue="en"
          className={`${authSelectClass} pl-10`}
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
