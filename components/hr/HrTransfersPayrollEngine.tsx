"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Building2,
  Check,
  FileText,
  Plus,
  RefreshCw,
  Send,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  Modal,
  modalFieldClass,
  modalSelectClass,
} from "@/components/ui/Modal";
import {
  borrowers,
  branches,
  employeeTransfers,
  formatInr,
  kendras,
  memberTransfers,
  payrollRows,
  transferReasons,
} from "@/components/hr/hr-data";

export type HrEngineTab =
  | "member"
  | "employee"
  | "payroll"
  | "banking";

const tabs: {
  id: HrEngineTab;
  label: string;
  href: string;
  icon: typeof Users;
}[] = [
  {
    id: "member",
    label: "Member Transfer Hub",
    href: "/hr/member-transfers",
    icon: Users,
  },
  {
    id: "employee",
    label: "Employee Postings",
    href: "/hr/transfers",
    icon: ArrowLeftRight,
  },
  {
    id: "payroll",
    label: "Payroll Engine",
    href: "/hr/payroll",
    icon: Wallet,
  },
  {
    id: "banking",
    label: "Corporate Banking",
    href: "/hr/payroll?tab=banking",
    icon: Building2,
  },
];

type Props = {
  activeTab: HrEngineTab;
};

export function HrTransfersPayrollEngine({ activeTab }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
          <RefreshCw className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Transfers & Payroll Engine
          </h1>
          <p className="mt-1 text-sm text-muted">
            Member & Employee Transfers · Salary Processing · Corporate Banking
          </p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-border scrollbar-thin">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
                active
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {activeTab === "member" ? <MemberTransferHub /> : null}
      {activeTab === "employee" ? <EmployeePostings /> : null}
      {activeTab === "payroll" ? <PayrollEngine /> : null}
      {activeTab === "banking" ? <CorporateBanking /> : null}
    </div>
  );
}

function StatCards({
  items,
}: {
  items: { label: string; value: string; hint: string; tone?: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)]"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-soft uppercase">
            {item.label}
          </p>
          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${
              item.tone ?? "text-slate-900"
            }`}
          >
            {item.value}
          </p>
          <p className="mt-1 text-xs text-muted">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

function MemberTransferHub() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(memberTransfers);

  return (
    <div className="space-y-5">
      <StatCards
        items={[
          {
            label: "Total Transfers",
            value: String(rows.length),
            hint: "All time transfer orders",
          },
          {
            label: "Completed",
            value: String(rows.filter((r) => r.status === "Completed").length),
            hint: "Successfully migrated",
            tone: "text-emerald-600",
          },
          {
            label: "Active Borrowers",
            value: "20",
            hint: "Eligible for transfer",
            tone: "text-violet-600",
          },
        ]}
      />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Member Transfer Audit Log
          </h2>
          <Button
            variant="violet"
            icon={Plus}
            onClick={() => setOpen(true)}
          >
            New Member Transfer
          </Button>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Order #</th>
                <th className="pb-3 pr-3">Member</th>
                <th className="pb-3 pr-3">From</th>
                <th className="pb-3 pr-3">To</th>
                <th className="pb-3 pr-3">Reason</th>
                <th className="pb-3 pr-3">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.orderNo} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-violet-600">
                    {row.orderNo}
                  </td>
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.member}
                  </td>
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-slate-800">{row.fromBranch}</p>
                    <p className="text-xs text-muted">{row.fromKendra}</p>
                  </td>
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-slate-800">{row.toBranch}</p>
                    <p className="text-xs text-muted">{row.toKendra}</p>
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.reason}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.date}</td>
                  <td className="py-3.5">
                    <Badge tone="success" caps={false}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <NewMemberTransferModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(order) => {
          setRows((prev) => [order, ...prev]);
          setOpen(false);
        }}
      />
    </div>
  );
}

function NewMemberTransferModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (order: (typeof memberTransfers)[number]) => void;
}) {
  const [member, setMember] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [toKendra, setToKendra] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  function submit() {
    if (!member || !toBranch || !toKendra || !reason) return;
    onCreate({
      orderNo: `MTO-2026-${String(memberTransfers.length + 2).padStart(4, "0")}`,
      member,
      fromBranch: "Karveer Rural Branch",
      fromKendra: "Gandhinagar Kendra 01",
      toBranch,
      toKendra,
      reason: remarks ? `${reason} — ${remarks}` : reason,
      date: "17 Sep 2026",
      status: "Pending",
    });
    setMember("");
    setToBranch("");
    setToKendra("");
    setReason("");
    setRemarks("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="New Member Transfer Order"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="violet" icon={Check} onClick={submit}>
            Create Transfer Order
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Select Borrower" required>
          <select
            className={modalSelectClass}
            value={member}
            onChange={(event) => setMember(event.target.value)}
          >
            <option value="">— Choose Member —</option>
            {borrowers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="To Branch" required>
            <select
              className={modalSelectClass}
              value={toBranch}
              onChange={(event) => setToBranch(event.target.value)}
            >
              <option value="">— Select Branch —</option>
              {branches.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="To Kendra" required>
            <select
              className={modalSelectClass}
              value={toKendra}
              onChange={(event) => setToKendra(event.target.value)}
            >
              <option value="">— Select Centre —</option>
              {kendras.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Transfer Reason" required>
          <select
            className={modalSelectClass}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            <option value="">— Select Reason —</option>
            {transferReasons.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Additional Remarks">
          <textarea
            rows={3}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Optional notes..."
            className={modalFieldClass}
          />
        </FormField>
      </div>
    </Modal>
  );
}

function EmployeePostings() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(employeeTransfers);

  return (
    <div className="space-y-5">
      <StatCards
        items={[
          {
            label: "Total Postings",
            value: String(rows.length),
            hint: "All transfer orders",
          },
          {
            label: "Issued Orders",
            value: String(rows.filter((r) => r.status === "Issued").length),
            hint: "Awaiting joining",
            tone: "text-blue-600",
          },
          {
            label: "Active Staff",
            value: "114",
            hint: "Eligible for posting",
            tone: "text-violet-600",
          },
        ]}
      />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Employee Transfer Order Log
          </h2>
          <Button icon={Plus} onClick={() => setOpen(true)}>
            Issue Transfer Order
          </Button>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Order #</th>
                <th className="pb-3 pr-3">Employee</th>
                <th className="pb-3 pr-3">From Branch</th>
                <th className="pb-3 pr-3">To Branch</th>
                <th className="pb-3 pr-3">Effective Date</th>
                <th className="pb-3 pr-3">Reason</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.orderNo} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-blue-600">
                    {row.orderNo}
                  </td>
                  <td className="py-3.5 pr-3">
                    <p className="font-semibold text-slate-900">{row.employee}</p>
                    <p className="text-xs text-muted">{row.empId}</p>
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.fromBranch}</td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.toBranch}</td>
                  <td className="py-3.5 pr-3 text-slate-600">
                    {row.effectiveDate}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.reason}</td>
                  <td className="py-3.5">
                    <Badge tone="success" caps={false}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <IssueEmployeeTransferModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(order) => {
          setRows((prev) => [order, ...prev]);
          setOpen(false);
        }}
      />
    </div>
  );
}

function IssueEmployeeTransferModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (order: (typeof employeeTransfers)[number]) => void;
}) {
  const [employee, setEmployee] = useState("Sachin Shinde");
  const [toBranch, setToBranch] = useState("");
  const [reason, setReason] = useState("");

  function submit() {
    if (!toBranch || !reason) return;
    onCreate({
      orderNo: `ETO-2026-${String(employeeTransfers.length + 2).padStart(4, "0")}`,
      employee,
      empId: "EMP-FO-001",
      fromBranch: "Karveer Rural Branch",
      toBranch,
      effectiveDate: "20 Sep 2026",
      reason,
      status: "Issued",
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Issue Employee Transfer Order"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Check} onClick={submit}>
            Issue Order
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Employee" required>
          <select
            className={modalSelectClass}
            value={employee}
            onChange={(event) => setEmployee(event.target.value)}
          >
            <option>Sachin Shinde</option>
            <option>Priya More</option>
            <option>Amit Deshmukh</option>
            <option>Neha Kulkarni</option>
          </select>
        </FormField>
        <FormField label="To Branch" required>
          <select
            className={modalSelectClass}
            value={toBranch}
            onChange={(event) => setToBranch(event.target.value)}
          >
            <option value="">— Select Branch —</option>
            {branches.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Reason" required>
          <select
            className={modalSelectClass}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            <option value="">— Select Reason —</option>
            {transferReasons.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </Modal>
  );
}

function PayrollEngine() {
  const [month, setMonth] = useState("2026-08");
  const [disbursed, setDisbursed] = useState(true);
  const totalNet = payrollRows.reduce((sum, row) => sum + row.netPayable, 0);
  const totalIncentive = payrollRows.reduce(
    (sum, row) => sum + row.incentive,
    0,
  );
  const totalDeductions = payrollRows.reduce(
    (sum, row) => sum + row.deductions,
    0,
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="block text-sm">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted-soft uppercase">
              Payroll Month
            </span>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm">
              <p className="text-muted">
                Total Net Payroll{" "}
                <strong className="text-slate-900">{formatInr(totalNet)}</strong>
              </p>
              <p className="text-muted">
                Total Incentives{" "}
                <strong className="text-emerald-700">
                  {formatInr(totalIncentive)}
                </strong>
              </p>
            </div>
            <Button
              variant="success"
              icon={Send}
              onClick={() => setDisbursed(true)}
            >
              Disburse & Post to GL
            </Button>
          </div>
        </div>
      </section>

      {disbursed ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            Payroll Disbursed! Journal Voucher PAY-2026-2733 posted to GL —
            Staff Salary & Incentives Expense (5001) Dr{" "}
            {formatInr(totalNet)} / Bank Disbursal Operating Account (1002) Cr{" "}
            {formatInr(totalNet)}.
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Auto Journal Voucher on Disbursement · Debit 5001 Staff Salary &
            Incentives Expense — {formatInr(totalNet)} | Credit 1002 Bank
            Disbursal Operating Account — {formatInr(totalNet)}.
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="table-scroll">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Employee</th>
                <th className="pb-3 pr-3 text-right">Base Salary</th>
                <th className="pb-3 pr-3 text-right">Target</th>
                <th className="pb-3 pr-3 text-right">Collected</th>
                <th className="pb-3 pr-3 text-right">Achievement</th>
                <th className="pb-3 pr-3 text-right">Incentive</th>
                <th className="pb-3 pr-3 text-right">Deductions</th>
                <th className="pb-3 pr-3 text-right">Net Payable</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3">Pay Slip</th>
              </tr>
            </thead>
            <tbody>
              {payrollRows.map((row) => (
                <tr key={row.empId} className="border-t border-border/70">
                  <td className="py-3.5 pr-3">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-muted">
                      {row.empId} · {row.role}
                    </p>
                  </td>
                  <td className="py-3.5 pr-3 text-right font-medium text-slate-800">
                    {formatInr(row.baseSalary)}
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-600">
                    {row.target != null ? formatInr(row.target) : "—"}
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-600">
                    {row.collected != null ? formatInr(row.collected) : "—"}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-amber-600">
                    {row.achievement != null
                      ? `${row.achievement.toFixed(1)}%`
                      : "N/A"}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-emerald-700">
                    {row.incentive ? formatInr(row.incentive) : "—"}
                  </td>
                  <td className="py-3.5 pr-3 text-right text-rose-600">
                    {row.deductions ? formatInr(row.deductions) : "—"}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-bold text-slate-900">
                    {formatInr(row.netPayable)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <Badge tone="success" caps={false}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={FileText}
                      className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50/80">
                <td className="py-3.5 pr-3 font-bold text-slate-900">TOTALS</td>
                <td className="py-3.5 pr-3" />
                <td className="py-3.5 pr-3" />
                <td className="py-3.5 pr-3" />
                <td className="py-3.5 pr-3" />
                <td className="py-3.5 pr-3 text-right font-bold text-emerald-700">
                  {formatInr(totalIncentive)}
                </td>
                <td className="py-3.5 pr-3 text-right font-bold text-rose-600">
                  {formatInr(totalDeductions)}
                </td>
                <td className="py-3.5 pr-3 text-right font-bold text-slate-900">
                  {formatInr(totalNet)}
                </td>
                <td className="py-3.5 pr-3" />
                <td className="py-3.5" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CorporateBanking() {
  return (
    <div className="space-y-5">
      <StatCards
        items={[
          {
            label: "Operating A/c",
            value: "1002",
            hint: "Bank Disbursal Operating Account",
            tone: "text-blue-600",
          },
          {
            label: "Salary Expense GL",
            value: "5001",
            hint: "Staff Salary & Incentives",
            tone: "text-violet-600",
          },
          {
            label: "Last Payroll Batch",
            value: formatInr(167150),
            hint: "PAY-2026-2733 posted",
            tone: "text-emerald-600",
          },
        ]}
      />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Corporate Banking Settlement Map
        </h2>
        <p className="mt-1 text-sm text-muted">
          Payroll and incentive disbursals auto-post to CBS GL with dual-entry
          invariant
        </p>
        <div className="mt-4 space-y-3">
          {[
            {
              title: "Staff Salary & Incentives Expense (5001)",
              body: "Debited on payroll disbursement for base + incentive net of deductions.",
            },
            {
              title: "Bank Disbursal Operating Account (1002)",
              body: "Credited for NEFT/IMPS salary payouts to employee bank accounts.",
            },
            {
              title: "Member Transfer Clearing",
              body: "Internal control A/c for borrower Kendra/branch migration without ledger break.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 px-4 py-3"
            >
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
