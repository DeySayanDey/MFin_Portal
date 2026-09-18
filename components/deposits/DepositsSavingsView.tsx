"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Minus,
  PiggyBank,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DepositTxnModal,
  OpenDepositAccountModal,
  ShareCertificateModal,
} from "@/components/deposits/DepositModals";
import {
  accountsByProduct,
  formatInr,
  metricToneClass,
  type DepositAccount,
} from "@/components/deposits/deposits-data";

export function DepositsSavingsView() {
  const accounts = accountsByProduct(["Savings", "Voluntary"]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DepositAccount | null>(null);
  const [modal, setModal] = useState<
    "deposit" | "withdraw" | "share" | "open" | null
  >(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (row) =>
        row.account.toLowerCase().includes(q) ||
        row.member.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q),
    );
  }, [accounts, query]);

  const totalBalance = accounts.reduce((sum, row) => sum + row.balance, 0);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Bachat Gat Group Savings
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Compulsory Bachat Gat member savings, monthly interest accrual,
            digital passbook, and JLG emergency buffer funds
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={Award}
            onClick={() => {
              setSelected(accounts[0] ?? null);
              setModal("share");
            }}
          >
            Share Certificate
          </Button>
          <Button icon={UserPlus} onClick={() => setModal("open")}>
            Open Savings A/c
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Savings Accounts",
            value: String(accounts.length),
            hint: "Compulsory + Voluntary",
            tone: "blue" as const,
          },
          {
            label: "Total Balance",
            value: formatInr(totalBalance, 0),
            hint: "Vault-reconciled",
            tone: "green" as const,
          },
          {
            label: "Interest Rate",
            value: "6.5% p.a.",
            hint: "Compulsory savings",
            tone: "violet" as const,
          },
          {
            label: "Share Face Value",
            value: "₹100",
            hint: "COOP-WB/2026/8942",
            tone: "amber" as const,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border px-4 py-3.5 ${metricToneClass[metric.tone]}`}
          >
            <p className="text-xs font-semibold tracking-wide uppercase opacity-80">
              {metric.label}
            </p>
            <p className="mt-1.5 text-xl font-bold tracking-tight">
              {metric.value}
            </p>
            <p className="mt-1 text-xs opacity-75">{metric.hint}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <PiggyBank className="h-4 w-4 text-slate-500" />
              Compulsory Group Savings Register
            </h2>
            <p className="mt-1 text-sm text-muted">
              Interest rates, total deposits, and instant ledger passbooks
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter records..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Account No.</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3">JLG Group</th>
                <th className="pb-3 pr-3">Product</th>
                <th className="pb-3 pr-3">Interest</th>
                <th className="pb-3 pr-3 text-right">Balance</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.account} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.account}
                  </td>
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-slate-800">{row.member}</p>
                    <p className="text-xs text-muted">{row.memberId}</p>
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.group}</td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.productLabel}</td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.rate}% p.a.</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.balance)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <Badge tone="success" caps={false}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="success"
                        icon={Plus}
                        onClick={() => {
                          setSelected(row);
                          setModal("deposit");
                        }}
                      >
                        Deposit
                      </Button>
                      <Button
                        size="sm"
                        variant="amber"
                        icon={Minus}
                        onClick={() => {
                          setSelected(row);
                          setModal("withdraw");
                        }}
                      >
                        Withdraw
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DepositTxnModal
        open={modal === "deposit" || modal === "withdraw"}
        onClose={() => setModal(null)}
        account={selected}
        kind={modal === "withdraw" ? "withdrawal" : "deposit"}
      />
      <ShareCertificateModal
        open={modal === "share"}
        onClose={() => setModal(null)}
        account={selected}
      />
      <OpenDepositAccountModal
        open={modal === "open"}
        onClose={() => setModal(null)}
        product="Savings"
      />
    </div>
  );
}
