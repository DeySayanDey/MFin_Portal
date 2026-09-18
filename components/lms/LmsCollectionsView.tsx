"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  HandCoins,
  MapPin,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CashCollectModal,
  EmiReceiptModal,
  MarkAttendanceModal,
  UpiPayModal,
  type CollectionMember,
} from "@/components/lms/LmsCollectionModals";

const meetingMembers: CollectionMember[] = [
  {
    loanId: "LN-2026-00002",
    name: "Rani Patil",
    group: "Swanirbhar Mahila JLG #002",
    memberNo: "Member #4/12",
    principalDue: 2680,
    interestDue: 337.49,
    totalDue: 3017.49,
  },
  {
    loanId: "LN-2026-00112",
    name: "Aarti Saha",
    group: "Swanirbhar Mahila JLG #112",
    memberNo: "Member #6/12",
    principalDue: 2720,
    interestDue: 351.56,
    totalDue: 3071.56,
  },
  {
    loanId: "LN-2026-00117",
    name: "Mousumi Ghosh",
    group: "Swanirbhar Mahila JLG #002",
    memberNo: "Member #5/12",
    principalDue: 2550,
    interestDue: 318.2,
    totalDue: 2868.2,
  },
  {
    loanId: "LN-2026-00120",
    name: "Gita Saha",
    group: "Swanirbhar Mahila JLG #005",
    memberNo: "Member #3/12",
    principalDue: 3100,
    interestDue: 420.5,
    totalDue: 3520.5,
  },
  {
    loanId: "LN-2026-00104",
    name: "Lakshmi Saha",
    group: "Swanirbhar Mahila JLG #002",
    memberNo: "Member #8/12",
    principalDue: 2400,
    interestDue: 290,
    totalDue: 2690,
  },
];

const recentReceipts = [
  {
    receipt: "RCPT-202608-001",
    member: "Laxmi Mahila JLG — Member #01",
    loan: "LN-2026-00001",
    amount: 3017.49,
    mode: "Kendra Meeting Cash",
  },
  {
    receipt: "RCPT-202608-002",
    member: "Laxmi Mahila JLG — Member #02",
    loan: "LN-2026-00002",
    amount: 3071.56,
    mode: "Kendra Meeting Cash",
  },
  {
    receipt: "RCPT-202608-003",
    member: "Gita Saha — JLG #005",
    loan: "LN-2026-00120",
    amount: 3520.5,
    mode: "UPI QR",
  },
  {
    receipt: "RCPT-202608-004",
    member: "Aarti Saha — JLG #112",
    loan: "LN-2026-00112",
    amount: 3071.56,
    mode: "Field Wallet Hand-in",
  },
];

const metrics = [
  {
    label: "Today's Collection",
    value: "₹8,420.00",
    hint: "Vault credited",
    tone: "green" as const,
  },
  {
    label: "EMI Due Today",
    value: "₹15,167.75",
    hint: "1 Kendra meeting",
    tone: "blue" as const,
  },
  {
    label: "Field Wallet Pending",
    value: "₹3,200.00",
    hint: "Hand-in queue",
    tone: "amber" as const,
  },
  {
    label: "Collection Efficiency",
    value: "99.16%",
    hint: "MTD",
    tone: "violet" as const,
  },
];

const toneClass = {
  green: "border-emerald-100 bg-emerald-50/80 text-emerald-800",
  blue: "border-blue-100 bg-blue-50/80 text-blue-800",
  amber: "border-amber-100 bg-amber-50/80 text-amber-900",
  violet: "border-violet-100 bg-violet-50/80 text-violet-800",
};

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

type ModalKind = "upi" | "receipt" | "cash" | "attendance" | null;

export function LmsCollectionsView() {
  const [query, setQuery] = useState("");
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [selected, setSelected] = useState<CollectionMember | null>(null);

  const members = useMemo(
    () =>
      meetingMembers.map((row) => ({
        ...row,
        paid: paidIds.has(row.loanId),
      })),
    [paidIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (row) =>
        row.loanId.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.group.toLowerCase().includes(q),
    );
  }, [members, query]);

  const dueTotal = members
    .filter((row) => !row.paid)
    .reduce((sum, row) => sum + row.totalDue, 0);
  const collectedTotal = members
    .filter((row) => row.paid)
    .reduce((sum, row) => sum + row.totalDue, 0);

  function openMemberModal(
    kind: "upi" | "receipt" | "cash",
    member: CollectionMember,
  ) {
    setSelected(member);
    setActiveModal(kind);
  }

  function closeModal() {
    setActiveModal(null);
    setSelected(null);
  }

  function markPaid(loanId: string) {
    setPaidIds((prev) => new Set(prev).add(loanId));
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            LMS Repayment Collections
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            Kendra meeting cash collections, EMI receipts, dynamic UPI QR, and
            field wallet reconciliation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="violet"
            icon={ClipboardCheck}
            onClick={() => setActiveModal("attendance")}
          >
            Mark Attendance
          </Button>
          <Button variant="success" icon={HandCoins}>
            Field Wallet Hand-in
          </Button>
          <Button icon={RefreshCw} variant="secondary">
            Sync Meeting
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border px-4 py-3.5 ${toneClass[metric.tone]}`}
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

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 bg-[#111827] px-4 py-4 text-white sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              <CalendarDays className="h-3.5 w-3.5" />
              Live Meeting · Tuesday 09:30
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Kendra #002 (Howrah Uluberia) · CEN-WB002
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Howrah Uluberia Centre
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {members.length} members due
              </span>
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Weekly attendance, scheduled installment breakdown, dynamic UPI QR
              and cash receipts
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] text-slate-400">Still Due</p>
              <p className="mt-0.5 text-base font-bold text-amber-300">
                {formatInr(dueTotal)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] text-slate-400">Collected Now</p>
              <p className="mt-0.5 text-base font-bold text-emerald-300">
                {formatInr(collectedTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-border px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Meeting Installment Roster
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                Collect via UPI QR or cash — posts to loan A/c & GL instantly
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter members..."
                className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
              />
            </div>
          </div>
        </div>

        <div className="table-scroll px-1 sm:px-2">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="px-3 py-3">Loan A/c</th>
                <th className="px-3 py-3">Borrower</th>
                <th className="px-3 py-3">JLG Group</th>
                <th className="px-3 py-3 text-right">Principal</th>
                <th className="px-3 py-3 text-right">Interest</th>
                <th className="px-3 py-3 text-right">Total Due</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.loanId} className="border-t border-border/70">
                  <td className="px-3 py-3.5 font-semibold text-slate-900">
                    {row.loanId}
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-medium text-slate-800">{row.name}</p>
                    <p className="text-xs text-muted">{row.memberNo}</p>
                  </td>
                  <td className="px-3 py-3.5 text-slate-600">{row.group}</td>
                  <td className="px-3 py-3.5 text-right font-medium text-slate-800">
                    {formatInr(row.principalDue)}
                  </td>
                  <td className="px-3 py-3.5 text-right text-slate-600">
                    {formatInr(row.interestDue)}
                  </td>
                  <td className="px-3 py-3.5 text-right font-semibold text-emerald-700">
                    {formatInr(row.totalDue)}
                  </td>
                  <td className="px-3 py-3.5">
                    {row.paid ? (
                      <Badge tone="success" caps={false}>
                        Collected
                      </Badge>
                    ) : (
                      <Badge tone="warning" caps={false}>
                        Due Today
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={QrCode}
                        className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        disabled={row.paid}
                        onClick={() => openMemberModal("upi", row)}
                      >
                        UPI
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        icon={HandCoins}
                        disabled={row.paid}
                        onClick={() => openMemberModal("cash", row)}
                      >
                        Cash
                      </Button>
                      <Button
                        size="sm"
                        variant="amber"
                        icon={Receipt}
                        onClick={() => openMemberModal("receipt", row)}
                      >
                        Receipt
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted sm:px-5">
          <p>
            Showing {filtered.length} of {members.length} meeting members
          </p>
          <p className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {paidIds.size} collected in this session
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <BookOpen className="h-4 w-4 text-slate-500" />
              Recent EMI Collections
            </h2>
            <p className="mt-1 text-sm text-muted">
              Vault-credited collections with agent and Kendra attribution
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Receipt No.</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3">Loan A/c</th>
                <th className="pb-3 pr-3 text-right">Amount</th>
                <th className="pb-3">Mode</th>
              </tr>
            </thead>
            <tbody>
              {recentReceipts.map((row) => (
                <tr key={row.receipt} className="border-t border-border/70">
                  <td className="py-3 pr-3 font-semibold text-slate-900">
                    {row.receipt}
                  </td>
                  <td className="py-3 pr-3 text-slate-700">{row.member}</td>
                  <td className="py-3 pr-3 font-medium text-slate-800">
                    {row.loan}
                  </td>
                  <td className="py-3 pr-3 text-right font-semibold text-emerald-700">
                    {formatInr(row.amount)}
                  </td>
                  <td className="py-3">
                    <Badge
                      tone={row.mode.includes("UPI") ? "info" : "neutral"}
                      caps={false}
                    >
                      {row.mode}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <UpiPayModal
        open={activeModal === "upi"}
        onClose={closeModal}
        member={selected}
      />
      <EmiReceiptModal
        open={activeModal === "receipt"}
        onClose={closeModal}
        member={selected}
      />
      <CashCollectModal
        open={activeModal === "cash"}
        onClose={closeModal}
        member={selected}
        onConfirm={() => {
          if (selected) markPaid(selected.loanId);
        }}
      />
      <MarkAttendanceModal
        open={activeModal === "attendance"}
        onClose={closeModal}
        members={members}
      />
    </div>
  );
}
