"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  CloudDownload,
  Code2,
  FileCode2,
  Lock,
  MessageCircle,
  Plus,
  RadioTower,
  RefreshCw,
  Save,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

const permissionOptions = [
  "Onboard KYC",
  "Apply Loan",
  "Sanction Loan",
  "Disburse Loan",
  "Collect EMI",
  "Reverse Vouchers",
  "Legal Notices",
  "View Reports",
] as const;

const seriesRows = [
  {
    entity: "Kendra Centre Code Series",
    prefix: "CEN-",
    counter: 3,
    padding: 2,
    suffix: "",
    sample: "CEN-03",
  },
  {
    entity: "Borrower / Member ID Series",
    prefix: "CUST-2026-",
    counter: 4,
    padding: 4,
    suffix: "",
    sample: "CUST-2026-0004",
  },
  {
    entity: "Staff / Employee ID Series",
    prefix: "EMP-",
    counter: 5,
    padding: 3,
    suffix: "",
    sample: "EMP-005",
  },
  {
    entity: "Joint Liability Group (JLG) Code",
    prefix: "JLG-",
    counter: 3,
    padding: 2,
    suffix: "",
    sample: "JLG-03",
  },
  {
    entity: "Legal Demand Notice Reference Series",
    prefix: "NOTC-2026-",
    counter: 2,
    padding: 5,
    suffix: "",
    sample: "NOTC-2026-00002",
  },
  {
    entity: "Loan Account Number Series",
    prefix: "LN-2026-",
    counter: 4,
    padding: 5,
    suffix: "",
    sample: "LN-2026-00004",
  },
  {
    entity: "No Objection Certificate (NOC) Series",
    prefix: "NOC-2026-",
    counter: 1,
    padding: 5,
    suffix: "",
    sample: "NOC-2026-00001",
  },
  {
    entity: "Double-Entry Journal Voucher Series",
    prefix: "JV-2026-",
    counter: 25,
    padding: 4,
    suffix: "",
    sample: "JV-2026-0025",
  },
];

const roles = [
  {
    title: "Branch Accountant",
    dept: "Accounts & Finance",
    checked: ["Collect EMI", "Disburse Loan", "Reverse Vouchers", "View Reports"],
  },
  {
    title: "Branch Manager",
    dept: "Branch Operations",
    checked: [...permissionOptions],
    limit: 150000,
  },
  {
    title: "Credit Underwriter",
    dept: "Credit & Risk",
    checked: ["Sanction Loan", "Apply Loan", "View Reports"],
    limit: 100000,
  },
  {
    title: "Field Officer (Kendra Manager)",
    dept: "Field Operations",
    checked: ["Onboard KYC", "Collect EMI", "Apply Loan"],
  },
  {
    title: "Recovery Officer",
    dept: "Legal & Debt Recovery",
    checked: ["Collect EMI", "Legal Notices", "View Reports"],
  },
];

const eventTriggers = [
  "On Customer Onboard",
  "On EMI Collection Receipt",
  "On Loan Sanction",
  "On Kendra Due Reminder",
  "On Disbursal Payout",
  "On Defaulter Demand Notice",
];

const entityCards = [
  {
    label: "Borrowers / Members",
    count: "123",
    countClass: "text-slate-900",
    note: "UIDAI & Bank Verified",
    noteClass: "text-emerald-600",
  },
  {
    label: "Active Loan Accounts",
    count: "123",
    countClass: "text-blue-600",
    note: "1476 Schedules",
    noteClass: "text-muted",
  },
  {
    label: "Kendra Centres",
    count: "112",
    countClass: "text-blue-600",
    note: "117 JLG Groups",
    noteClass: "text-muted",
  },
  {
    label: "Branches",
    count: "106",
    countClass: "text-emerald-600",
    note: "114 Officers",
    noteClass: "text-muted",
  },
  {
    label: "Loan Products / Schemes",
    count: "4",
    countClass: "text-violet-600",
    note: "Agriculture, Dairy, Artisan",
    noteClass: "text-violet-500",
  },
  {
    label: "Repayment Collections",
    count: "25",
    countClass: "text-emerald-600",
    note: "Cash & UPI QR Vouchers",
    noteClass: "text-emerald-600",
  },
  {
    label: "Double-Entry GL Accounts",
    count: "86",
    countClass: "text-slate-900",
    note: "3 Journal Vouchers",
    noteClass: "text-muted",
  },
  {
    label: "Audit & Notification Logs",
    count: "3",
    countClass: "text-orange-500",
    note: "SHA-256 Block Chained",
    noteClass: "text-orange-500",
  },
];

const voucherTypes = [
  "Contra Transfers",
  "Expense Vouchers",
  "Journal Vouchers",
  "Rectification / Reversal",
  "Withdrawal Vouchers",
] as const;

type MakerRule = {
  id: string;
  voucherType: (typeof voucherTypes)[number];
  threshold: number;
  makers: string;
  checkers: string;
  dualAuth: boolean;
  autoApprove: boolean;
};

const initialMakerRules: MakerRule[] = [
  {
    id: "1",
    voucherType: "Contra Transfers",
    threshold: 25000,
    makers: "Cashier",
    checkers: "BranchManager, VaultCustodian",
    dualAuth: true,
    autoApprove: true,
  },
  {
    id: "2",
    voucherType: "Expense Vouchers",
    threshold: 2000,
    makers: "Cashier, JuniorAccountant",
    checkers: "BranchManager, Supervisor",
    dualAuth: true,
    autoApprove: true,
  },
  {
    id: "3",
    voucherType: "Journal Vouchers",
    threshold: 0,
    makers: "JuniorAccountant, Cashier",
    checkers: "SeniorAccountant, BranchManager",
    dualAuth: true,
    autoApprove: true,
  },
  {
    id: "4",
    voucherType: "Rectification / Reversal",
    threshold: 0,
    makers: "Cashier, JuniorAccountant",
    checkers: "BranchManager, Auditor",
    dualAuth: true,
    autoApprove: true,
  },
  {
    id: "5",
    voucherType: "Withdrawal Vouchers",
    threshold: 10000,
    makers: "Cashier, FieldAgent",
    checkers: "BranchManager, SeniorCashier",
    dualAuth: true,
    autoApprove: true,
  },
];

export function SeriesPanel() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      seriesRows.filter((row) =>
        row.entity.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-blue-900">
            Custom Number Series & Auto-Increment Engine
          </h2>
          <p className="mt-1 text-sm text-blue-800/80">
            Configure distinct numbering formats, prefixes, counters, and padding
            lengths for all system entities.
          </p>
        </div>
        <span className="w-fit rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          8 Series Configured
        </span>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Configured Numbering Sequences
          </h3>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter records..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2 pr-3 pl-9 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3 font-semibold">Entity / Module</th>
                <th className="pb-3 pr-3 font-semibold">Custom Prefix</th>
                <th className="pb-3 pr-3 font-semibold">Next Counter</th>
                <th className="pb-3 pr-3 font-semibold">Padding Digits</th>
                <th className="pb-3 pr-3 font-semibold">Suffix</th>
                <th className="pb-3 pr-3 font-semibold">Live Formatted Sample</th>
                <th className="pb-3 pr-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.entity} className="border-b border-border/70 last:border-0">
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.entity}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-xs font-semibold text-blue-700">
                      {row.prefix}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-slate-700">
                    {row.counter}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-slate-700">
                    {row.padding}
                  </td>
                  <td className="py-3.5 pr-3 text-muted">{row.suffix || "—"}</td>
                  <td className="py-3.5 pr-3 font-mono text-sm font-semibold text-slate-800">
                    {row.sample}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
                      Active
                    </span>
                  </td>
                  <td className="py-3.5">
                    <button type="button" className="btn btn-secondary btn-sm">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Configure Series
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function TimingsPanel() {
  const [opening, setOpening] = useState("08:00 AM");
  const [closing, setClosing] = useState("07:30 PM");
  const [timeout, setTimeoutMins] = useState(30);
  const [days, setDays] = useState("Monday to Saturday (08:00 AM - 07:30 PM)");
  const [flags, setFlags] = useState({
    sunday: false,
    holidays: true,
    offline: true,
  });

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <h2 className="text-base font-semibold text-slate-900">
        Branch Working Hours & Session Controls
      </h2>
      <p className="mt-1 text-sm text-muted">
        Prevent unauthorized staff logins outside prescribed institutional
        operating windows.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Branch Opening Time" value={opening} onChange={setOpening} />
        <Field label="Branch Closing Time" value={closing} onChange={setClosing} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Session Inactivity Timeout (Minutes)
          </span>
          <input
            type="number"
            min={1}
            value={timeout}
            onChange={(event) => setTimeoutMins(Number(event.target.value) || 0)}
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <Field
          label="Working Days Description"
          value={days}
          onChange={setDays}
        />
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-surface-muted px-4 py-3">
        <CheckRow
          checked={flags.sunday}
          label="Allow System Logins on Sundays"
          onChange={(checked) => setFlags((prev) => ({ ...prev, sunday: checked }))}
        />
        <CheckRow
          checked={flags.holidays}
          label="Lockout Branch Logins on National & Bank Holidays"
          onChange={(checked) =>
            setFlags((prev) => ({ ...prev, holidays: checked }))
          }
        />
        <CheckRow
          checked={flags.offline}
          label="Allow Field Officers Mobile Offline Collection Outside Branch Hours"
          onChange={(checked) =>
            setFlags((prev) => ({ ...prev, offline: checked }))
          }
        />
      </div>

      <div className="btn-actions mt-4">
        <PrimaryButton icon={Clock3}>Save Operating Timings</PrimaryButton>
      </div>
    </section>
  );
}

export function RbacPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
        <h2 className="text-base font-semibold text-blue-900">
          Role-Based Access Control (RBAC) & Designation Permissions
        </h2>
        <p className="mt-1 text-sm text-blue-800/80">
          Grant or restrict operational capabilities (Loan Sanction, Disbursal,
          Collection, Reversals, Legal Notice).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {roles.map((role) => (
          <article
            key={role.title}
            className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{role.title}</h3>
                <p className="mt-0.5 text-sm text-muted">{role.dept}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                Active Role
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {permissionOptions.map((permission) => (
                <CheckRow
                  key={`${role.title}-${permission}`}
                  checked={role.checked.includes(permission)}
                  label={permission}
                  onChange={() => undefined}
                />
              ))}
            </div>

            {"limit" in role && role.limit != null ? (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Max Sanction Limit (₹):
                </span>
                <input
                  type="number"
                  defaultValue={role.limit}
                  className="w-full max-w-xs rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
            ) : null}

            <div className="btn-actions mt-4">
              <button type="button" className="btn btn-primary btn-sm">
                <Check className="h-3.5 w-3.5" />
                Update Role
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function GatewayPanel() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <h2 className="text-base font-semibold text-slate-900">
        SMS & WhatsApp Cloud API Gateway Credentials
      </h2>
      <p className="mt-1 text-sm text-muted">
        Configure Indian Telecom DLT registration IDs and Meta WhatsApp Cloud API
        credentials.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              Fast2SMS / DLT Gateway
            </p>
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
              Active
            </span>
          </div>
          <div className="space-y-3">
            <Field label="SMS API Key" value="••••••••••••••••••••" onChange={() => undefined} />
            <Field
              label="6-Character Sender ID (DLT Header)"
              value="EZIMCR"
              onChange={() => undefined}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <RadioTower className="h-4 w-4 text-emerald-600" />
              Meta WhatsApp Cloud API
            </p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Connected
            </span>
          </div>
          <div className="space-y-3">
            <Field
              label="System User Access Token"
              value="••••••••••••••••••••"
              onChange={() => undefined}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Phone Number ID"
                value="189876543218987"
                onChange={() => undefined}
              />
              <Field
                label="WABA ID"
                value="987654321898765"
                onChange={() => undefined}
              />
            </div>
          </div>
        </article>
      </div>

      <div className="mt-4 rounded-2xl bg-surface-muted px-4 py-3">
        <p className="mb-3 text-sm font-semibold text-slate-800">
          Automated Event Triggers & Alerts
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {eventTriggers.map((trigger) => (
            <CheckRow
              key={trigger}
              checked
              label={trigger}
              onChange={() => undefined}
            />
          ))}
        </div>
      </div>

      <div className="btn-actions mt-4">
        <PrimaryButton icon={RadioTower}>Save Gateway Configuration</PrimaryButton>
      </div>
    </section>
  );
}

export function RbiPanel() {
  const [policy, setPolicy] = useState({
    income: 300000,
    foir: 50,
    minJlg: 4,
    maxJlg: 10,
    firstCycle: 50000,
    nextCycle: 80000,
    pennyDrop: true,
    cibil: true,
    prepayPenalty: false,
  });

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <h2 className="text-base font-semibold text-slate-900">
        RBI Harmonized Microfinance Regulations & Credit Guardrails
      </h2>
      <p className="mt-1 text-sm text-muted">
        Statutory limits mandated under RBI/2021-22/112 Master Direction on
        Microfinance Loans
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <NumberField
          label="Max Annual Household Income Limit (₹)"
          value={policy.income}
          help="RBI Microfinance threshold: ₹3,00,000 p.a."
          onChange={(value) => setPolicy((prev) => ({ ...prev, income: value }))}
        />
        <NumberField
          label="Max FOIR Debt Burden Ceiling (%)"
          value={policy.foir}
          help="Max 50% of monthly household surplus"
          onChange={(value) => setPolicy((prev) => ({ ...prev, foir: value }))}
        />
        <NumberField
          label="Min JLG Group Members"
          value={policy.minJlg}
          onChange={(value) => setPolicy((prev) => ({ ...prev, minJlg: value }))}
        />
        <NumberField
          label="Max JLG Group Members"
          value={policy.maxJlg}
          onChange={(value) => setPolicy((prev) => ({ ...prev, maxJlg: value }))}
        />
        <NumberField
          label="Max Sanction Limit (1st Loan Cycle ₹)"
          value={policy.firstCycle}
          onChange={(value) =>
            setPolicy((prev) => ({ ...prev, firstCycle: value }))
          }
        />
        <NumberField
          label="Max Sanction Limit (2nd+ Loan Cycle ₹)"
          value={policy.nextCycle}
          onChange={(value) =>
            setPolicy((prev) => ({ ...prev, nextCycle: value }))
          }
        />
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-border bg-surface-muted px-4 py-3">
        <CheckRow
          checked={policy.pennyDrop}
          label="Mandatory Automated NPCI Penny-Drop Bank Account Verification"
          onChange={(checked) =>
            setPolicy((prev) => ({ ...prev, pennyDrop: checked }))
          }
        />
        <CheckRow
          checked={policy.cibil}
          label="Mandatory Live CIBIL / CRIF High Mark Score Check before Sanction"
          onChange={(checked) =>
            setPolicy((prev) => ({ ...prev, cibil: checked }))
          }
        />
        <CheckRow
          checked={policy.prepayPenalty}
          label="Allow Prepayment / Foreclosure Penalties (Must remain unchecked per RBI norms)"
          onChange={(checked) =>
            setPolicy((prev) => ({ ...prev, prepayPenalty: checked }))
          }
        />
      </div>

      <div className="btn-actions mt-4">
        <PrimaryButton icon={Scale}>Save Lending Policies</PrimaryButton>
      </div>
    </section>
  );
}

export function SeedPanel() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <FileCode2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Real-Time Database State & JSON Seed Engine
            </h2>
            <p className="mt-1 text-sm text-muted">
              Database Provider: Microsoft.EntityFrameworkCore.InMemory
            </p>
          </div>
        </div>
        <div className="btn-actions">
          <button type="button" className="btn btn-secondary btn-sm">
            <RefreshCw className="h-4 w-4" />
            Refresh Counts
          </button>
          <button type="button" className="btn btn-primary btn-sm">
            <Trash2 className="h-4 w-4" />
            Clear Database (0 Records)
          </button>
          <button type="button" className="btn btn-primary btn-sm">
            <CloudDownload className="h-4 w-4" />
            Load 25+ Seed Data from JSON
          </button>
        </div>
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-soft">
        Live Entity Records In Database
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {entityCards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-border bg-surface-muted/40 p-4"
          >
            <p className="text-xs font-semibold text-slate-600">{card.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${card.countClass}`}>
              {card.count}
            </p>
            <p className={`mt-2 text-xs ${card.noteClass}`}>{card.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border bg-surface-muted/50 px-4 py-3 sm:flex-row sm:items-start">
        <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-slate-800">Seed Source JSON File:</p>
          <p className="mt-1 break-all font-mono text-xs text-blue-700">
            src/Backend/MicroFinance.Infrastructure/Persistence/seed_data.json
          </p>
          <p className="mt-2 text-xs text-muted">
            Contains 25+ Branches, 25 Products, 25 Centres, 25 JLGs, 25 Borrowers,
            25 Staff, 25 Deposit accounts, 25 NACH mandates, and 25 Audit records.
          </p>
        </div>
      </div>
    </section>
  );
}

export function MakerPanel() {
  const [rules, setRules] = useState(initialMakerRules);

  function updateRule(id: string, patch: Partial<MakerRule>) {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  }

  function addRule() {
    setRules((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        voucherType: "Journal Vouchers",
        threshold: 0,
        makers: "Cashier",
        checkers: "BranchManager",
        dualAuth: true,
        autoApprove: false,
      },
    ]);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Maker-Checker Dual Sign-off & Threshold Matrix{" "}
            <span className="font-medium text-muted">(মেকার-চেকার নিয়মাবলী)</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Configure financial threshold limits, segregation of duties, and
            checker approval designations by voucher type.
          </p>
        </div>
        <button
          type="button"
          onClick={addRule}
          className="btn btn-primary btn-sm"
        >
          <Plus className="h-4 w-4" />
          Add New Rule
        </button>
      </div>

      <div className="table-scroll">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
              <th className="pb-3 pr-3 font-semibold">Voucher Type</th>
              <th className="pb-3 pr-3 font-semibold">Threshold Limit (₹)</th>
              <th className="pb-3 pr-3 font-semibold">Maker Roles (Initiators)</th>
              <th className="pb-3 pr-3 font-semibold">Checker Roles (Approvers)</th>
              <th className="pb-3 pr-3 font-semibold">Dual Auth Mandatory</th>
              <th className="pb-3 pr-3 font-semibold">Auto-Approve Below</th>
              <th className="pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-3">
                  <select
                    value={rule.voucherType}
                    onChange={(event) =>
                      updateRule(rule.id, {
                        voucherType: event.target
                          .value as MakerRule["voucherType"],
                      })
                    }
                    className="w-full rounded-lg border border-border bg-surface-muted px-2 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  >
                    {voucherTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pr-3">
                  <input
                    type="number"
                    value={rule.threshold}
                    onChange={(event) =>
                      updateRule(rule.id, {
                        threshold: Number(event.target.value) || 0,
                      })
                    }
                    className="w-28 rounded-lg border border-border bg-surface-muted px-2 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    value={rule.makers}
                    onChange={(event) =>
                      updateRule(rule.id, { makers: event.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-surface-muted px-2 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    value={rule.checkers}
                    onChange={(event) =>
                      updateRule(rule.id, { checkers: event.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-surface-muted px-2 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    type="checkbox"
                    checked={rule.dualAuth}
                    onChange={(event) =>
                      updateRule(rule.id, { dualAuth: event.target.checked })
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>
                <td className="py-3 pr-3">
                  <input
                    type="checkbox"
                    checked={rule.autoApprove}
                    onChange={(event) =>
                      updateRule(rule.id, {
                        autoApprove: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>
                <td className="py-3">
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs italic text-muted">
          * Transactions equal to or exceeding the threshold limit will be
          automatically routed to the Checker Authorization Inbox.
        </p>
        <PrimaryButton icon={Lock}>Save Rules to Database</PrimaryButton>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  help,
  onChange,
}: {
  label: string;
  value: number;
  help?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
      {help ? <span className="mt-1 block text-xs text-muted">{help}</span> : null}
    </label>
  );
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
      />
      <span>{label}</span>
    </label>
  );
}

function PrimaryButton({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: typeof Save;
}) {
  return (
    <button type="button" className="btn btn-primary">
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}
