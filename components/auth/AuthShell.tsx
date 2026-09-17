"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  Languages,
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

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <aside className="relative overflow-hidden border-b border-border bg-slate-900 px-6 py-8 text-white sm:px-8 lg:flex lg:w-[44%] lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, rgba(22,163,74,0.45), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(37,99,235,0.28), transparent 50%)",
          }}
        />
        <div className="relative">
          <Link href="/login" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-sm">
              eZ
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">
                eZi-Micro
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-white/60">
                Core Banking Portal
              </span>
            </span>
          </Link>

          <h1 className="mt-8 max-w-md text-2xl font-semibold tracking-tight sm:text-3xl">
            Secure staff access to MFIN operations
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            Authenticate with your employee credentials. Sessions respect
            institutional software timings and RBI 2026 Core Banking Security
            Guidelines.
          </p>

          <ul className="mt-8 hidden space-y-4 lg:block">
            {highlights.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand">
                  <item.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/65">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-8 text-xs text-white/45 lg:mt-0">
          © {new Date().getFullYear()} eZiMicro Financial Services Ltd · Design
          & Developed By Priority Solutions
        </p>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-8">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Languages className="h-3.5 w-3.5 text-muted" />
            বাংলা / English
          </button>
        </div>

        <div className="flex flex-1 items-start justify-center px-4 pb-10 sm:px-8 lg:items-center">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const authFieldClass =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-muted-soft focus:border-brand/40 focus:ring-4 focus:ring-brand/10";
