"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  GitBranch,
  MapPin,
  Network,
  Pencil,
  Plus,
  Save,
  Search,
  Users,
  X,
} from "lucide-react";

type TabId = "branches" | "kendras" | "jlg" | "org";

type BranchRow = {
  code: string;
  name: string;
  manager: string;
  district: string;
  bsr: string;
  kendras: number;
  borrowers: number;
  status: "Active" | "Inactive";
};

type KendraRow = {
  code: string;
  name: string;
  branch: string;
  meetingDay: string;
  members: number;
  status: "Active" | "Inactive";
};

type JlgRow = {
  code: string;
  name: string;
  kendra: string;
  leader: string;
  members: number;
  status: "Active" | "Inactive";
};

const tabs: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "branches", label: "Branch Master", icon: Building2 },
  { id: "kendras", label: "Kendra Centres", icon: MapPin },
  { id: "jlg", label: "JLG Groups", icon: Users },
  { id: "org", label: "Org Chart", icon: Network },
];

const initialBranches: BranchRow[] = [
  {
    code: "KRV-001",
    name: "Karveer Rural Branch",
    manager: "Sachin Shinde",
    district: "Kolhapur, Maharashtra",
    bsr: "BSR-0091234",
    kendras: 3,
    borrowers: 48,
    status: "Active",
  },
  {
    code: "SNG-001",
    name: "Sangli Urban Branch",
    manager: "Anita Patil",
    district: "Sangli, Maharashtra",
    bsr: "BSR-0091235",
    kendras: 2,
    borrowers: 31,
    status: "Active",
  },
];

const initialKendras: KendraRow[] = [
  {
    code: "CEN-GN-01",
    name: "Gandhinagar Kendra 01",
    branch: "Karveer Rural Branch",
    meetingDay: "Monday",
    members: 18,
    status: "Active",
  },
  {
    code: "CEN-UC-02",
    name: "Uchgaon Kendra 02",
    branch: "Karveer Rural Branch",
    meetingDay: "Wednesday",
    members: 16,
    status: "Active",
  },
  {
    code: "CEN-SG-01",
    name: "Sangli Market Kendra",
    branch: "Sangli Urban Branch",
    meetingDay: "Friday",
    members: 15,
    status: "Active",
  },
];

const initialJlgs: JlgRow[] = [
  {
    code: "JLG-005",
    name: "Swanirbhar Mahila JLG",
    kendra: "Gandhinagar Kendra 01",
    leader: "Supriya Mondal",
    members: 5,
    status: "Active",
  },
  {
    code: "JLG-012",
    name: "Laxmi Mahila Bachat JLG",
    kendra: "Uchgaon Kendra 02",
    leader: "Sunita Kamble",
    members: 5,
    status: "Active",
  },
  {
    code: "JLG-018",
    name: "Shakti Women JLG",
    kendra: "Sangli Market Kendra",
    leader: "Anita Deshmukh",
    members: 5,
    status: "Active",
  },
];

const emptyBranchForm = {
  code: "",
  name: "",
  manager: "",
  district: "",
  bsr: "",
  kendras: 1,
  borrowers: 0,
};

export function KendraJlgView() {
  const [activeTab, setActiveTab] = useState<TabId>("branches");
  const [branches, setBranches] = useState<BranchRow[]>(initialBranches);
  const [kendras] = useState<KendraRow[]>(initialKendras);
  const [jlgs] = useState<JlgRow[]>(initialJlgs);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBranchForm);

  const filteredBranches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return branches;
    return branches.filter(
      (row) =>
        row.code.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.manager.toLowerCase().includes(q) ||
        row.district.toLowerCase().includes(q) ||
        row.bsr.toLowerCase().includes(q),
    );
  }, [branches, query]);

  const filteredKendras = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return kendras;
    return kendras.filter(
      (row) =>
        row.code.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.branch.toLowerCase().includes(q),
    );
  }, [kendras, query]);

  const filteredJlgs = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return jlgs;
    return jlgs.filter(
      (row) =>
        row.code.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.kendra.toLowerCase().includes(q) ||
        row.leader.toLowerCase().includes(q),
    );
  }, [jlgs, query]);

  const totals = useMemo(
    () => ({
      branches: branches.length,
      active: branches.filter((row) => row.status === "Active").length,
      borrowers: branches.reduce((sum, row) => sum + row.borrowers, 0),
      kendras: kendras.length,
      jlgs: jlgs.length,
    }),
    [branches, kendras, jlgs],
  );

  function openCreateBranch() {
    setEditingCode(null);
    setForm({
      ...emptyBranchForm,
      code: `BR-${String(branches.length + 1).padStart(3, "0")}`,
      bsr: "BSR-",
    });
    setModalOpen(true);
  }

  function openEditBranch(row: BranchRow) {
    setEditingCode(row.code);
    setForm({
      code: row.code,
      name: row.name,
      manager: row.manager,
      district: row.district,
      bsr: row.bsr,
      kendras: row.kendras,
      borrowers: row.borrowers,
    });
    setModalOpen(true);
  }

  function saveBranch() {
    if (!form.code.trim() || !form.name.trim() || !form.manager.trim()) return;

    const next: BranchRow = {
      code: form.code.trim(),
      name: form.name.trim(),
      manager: form.manager.trim(),
      district: form.district.trim(),
      bsr: form.bsr.trim(),
      kendras: Number(form.kendras) || 0,
      borrowers: Number(form.borrowers) || 0,
      status: "Active",
    };

    setBranches((prev) => {
      if (editingCode) {
        return prev.map((row) => (row.code === editingCode ? next : row));
      }
      return [next, ...prev];
    });
    setModalOpen(false);
  }

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    setQuery("");
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="inline-flex w-fit flex-wrap gap-1 rounded-2xl bg-slate-100 p-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${active ? "text-blue-600" : "text-slate-400"}`}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "branches" ? (
        <BranchMasterPanel
          branches={filteredBranches}
          totals={totals}
          query={query}
          onQueryChange={setQuery}
          onAdd={openCreateBranch}
          onEdit={openEditBranch}
        />
      ) : null}

      {activeTab === "kendras" ? (
        <KendraCentresPanel
          rows={filteredKendras}
          total={totals.kendras}
          query={query}
          onQueryChange={setQuery}
        />
      ) : null}

      {activeTab === "jlg" ? (
        <JlgGroupsPanel
          rows={filteredJlgs}
          total={totals.jlgs}
          query={query}
          onQueryChange={setQuery}
        />
      ) : null}

      {activeTab === "org" ? (
        <OrgChartPanel branches={branches} kendras={kendras} jlgs={jlgs} />
      ) : null}

      {modalOpen ? (
        <BranchModal
          editing={Boolean(editingCode)}
          form={form}
          onChange={(key, value) =>
            setForm((prev) => ({ ...prev, [key]: value }))
          }
          onClose={() => setModalOpen(false)}
          onSave={saveBranch}
        />
      ) : null}
    </div>
  );
}

function BranchMasterPanel({
  branches,
  totals,
  query,
  onQueryChange,
  onAdd,
  onEdit,
}: {
  branches: BranchRow[];
  totals: { branches: number; active: number; borrowers: number };
  query: string;
  onQueryChange: (value: string) => void;
  onAdd: () => void;
  onEdit: (row: BranchRow) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Branch Master
          </h1>
          <p className="mt-1 text-sm text-muted">
            All registered branches with manager assignments, BSR codes, and
            operational status
          </p>
        </div>
        <button type="button" onClick={onAdd} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Add Branch
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Branches"
          value={String(totals.branches)}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Active"
          value={String(totals.active)}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Total Borrowers"
          value={String(totals.borrowers)}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Branch Directory
            </h2>
            <p className="mt-1 text-sm text-muted">
              All operational branches with location, BSR code, and performance
              metrics
            </p>
          </div>
          <FilterInput value={query} onChange={onQueryChange} />
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3 font-semibold">Branch Code</th>
                <th className="pb-3 pr-3 font-semibold">Branch Name</th>
                <th className="pb-3 pr-3 font-semibold">Manager</th>
                <th className="pb-3 pr-3 font-semibold">District / State</th>
                <th className="pb-3 pr-3 font-semibold">BSR Code</th>
                <th className="pb-3 pr-3 font-semibold">Kendras</th>
                <th className="pb-3 pr-3 font-semibold">Borrowers</th>
                <th className="pb-3 pr-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((row) => (
                <tr
                  key={row.code}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      {row.code}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.name}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.manager}</td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.district}</td>
                  <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                    {row.bsr}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">
                    {row.kendras} Centres
                  </td>
                  <td className="py-3.5 pr-3 font-semibold tabular-nums text-slate-800">
                    {row.borrowers}
                  </td>
                  <td className="py-3.5 pr-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3.5">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function KendraCentresPanel({
  rows,
  total,
  query,
  onQueryChange,
}: {
  rows: KendraRow[];
  total: number;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <>
      <HeaderBlock
        title="Kendra Centres"
        subtitle="Meeting centres mapped to branches with day schedules and membership"
        actionLabel="Add Kendra"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Kendras"
          value={String(total)}
          tone="bg-violet-50 text-violet-700"
        />
        <StatCard
          label="Active Centres"
          value={String(rows.filter((r) => r.status === "Active").length)}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Mapped Members"
          value={String(rows.reduce((sum, r) => sum + r.members, 0))}
          tone="bg-blue-50 text-blue-700"
        />
      </div>
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Kendra Centre Directory
            </h2>
            <p className="mt-1 text-sm text-muted">
              Centre codes, parent branch mapping, and meeting cadence
            </p>
          </div>
          <FilterInput value={query} onChange={onQueryChange} />
        </div>
        <div className="table-scroll">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3 font-semibold">Centre Code</th>
                <th className="pb-3 pr-3 font-semibold">Kendra Name</th>
                <th className="pb-3 pr-3 font-semibold">Parent Branch</th>
                <th className="pb-3 pr-3 font-semibold">Meeting Day</th>
                <th className="pb-3 pr-3 font-semibold">Members</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.code}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-3">
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                      {row.code}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.name}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.branch}</td>
                  <td className="py-3.5 pr-3 text-slate-700">
                    {row.meetingDay}
                  </td>
                  <td className="py-3.5 pr-3 font-semibold tabular-nums">
                    {row.members}
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function JlgGroupsPanel({
  rows,
  total,
  query,
  onQueryChange,
}: {
  rows: JlgRow[];
  total: number;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <>
      <HeaderBlock
        title="JLG Groups"
        subtitle="Joint Liability Groups linked to Kendra centres with group leaders"
        actionLabel="Add JLG Group"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total JLG Groups"
          value={String(total)}
          tone="bg-rose-50 text-rose-700"
        />
        <StatCard
          label="Active Groups"
          value={String(rows.filter((r) => r.status === "Active").length)}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Group Members"
          value={String(rows.reduce((sum, r) => sum + r.members, 0))}
          tone="bg-amber-50 text-amber-700"
        />
      </div>
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              JLG Group Directory
            </h2>
            <p className="mt-1 text-sm text-muted">
              Group codes, Kendra linkage, and leader assignments
            </p>
          </div>
          <FilterInput value={query} onChange={onQueryChange} />
        </div>
        <div className="table-scroll">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3 font-semibold">JLG Code</th>
                <th className="pb-3 pr-3 font-semibold">Group Name</th>
                <th className="pb-3 pr-3 font-semibold">Kendra</th>
                <th className="pb-3 pr-3 font-semibold">Group Leader</th>
                <th className="pb-3 pr-3 font-semibold">Members</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.code}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-3">
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                      {row.code}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.name}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.kendra}</td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.leader}</td>
                  <td className="py-3.5 pr-3 font-semibold tabular-nums">
                    {row.members}
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function OrgChartPanel({
  branches,
  kendras,
  jlgs,
}: {
  branches: BranchRow[];
  kendras: KendraRow[];
  jlgs: JlgRow[];
}) {
  return (
    <>
      <HeaderBlock
        title="Organisation Chart"
        subtitle="Hierarchical Branch → Kendra → JLG structure for field operations"
      />
      <div className="grid gap-4">
        {branches.map((branch) => {
          const branchKendras = kendras.filter((k) => k.branch === branch.name);
          return (
            <section
              key={branch.code}
              className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {branch.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {branch.code} · {branch.manager} · {branch.district}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 border-l-2 border-blue-100 pl-4">
                {branchKendras.map((kendra) => {
                  const groups = jlgs.filter((g) => g.kendra === kendra.name);
                  return (
                    <div key={kendra.code} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-violet-600" />
                        <p className="text-sm font-semibold text-slate-800">
                          {kendra.name}
                        </p>
                        <span className="text-xs text-muted">
                          ({kendra.code})
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {groups.map((group) => (
                          <span
                            key={group.code}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            <GitBranch className="h-3 w-3 text-rose-500" />
                            {group.name}
                          </span>
                        ))}
                        {groups.length === 0 ? (
                          <span className="text-xs text-muted">
                            No JLG groups mapped
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function BranchModal({
  editing,
  form,
  onChange,
  onClose,
  onSave,
}: {
  editing: boolean;
  form: typeof emptyBranchForm;
  onChange: (key: keyof typeof emptyBranchForm, value: string | number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? "Edit Branch" : "Add Branch"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Configure branch location, manager, and BSR code for RBI reporting
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <Field label="Branch Code *">
            <input
              value={form.code}
              onChange={(event) => onChange("code", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="BSR Code *">
            <input
              value={form.bsr}
              onChange={(event) => onChange("bsr", event.target.value)}
              placeholder="e.g. BSR-0091234"
              className={inputClass}
            />
          </Field>
          <Field label="Branch Name *">
            <input
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Branch Manager *">
            <input
              value={form.manager}
              onChange={(event) => onChange("manager", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="District / State">
            <input
              value={form.district}
              onChange={(event) => onChange("district", event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Kendras">
            <input
              type="number"
              value={form.kendras}
              onChange={(event) =>
                onChange("kendras", Number(event.target.value) || 0)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Borrowers">
            <input
              type="number"
              value={form.borrowers}
              onChange={(event) =>
                onChange("borrowers", Number(event.target.value) || 0)
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="btn-actions border-t border-border bg-slate-50/80 px-5 py-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onSave} className="btn btn-primary">
            <Save className="h-4 w-4" />
            Save Branch
          </button>
        </div>
      </div>
    </div>
  );
}

function HeaderBlock({
  title,
  subtitle,
  actionLabel,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      {actionLabel ? (
        <button type="button" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl px-4 py-4 ${tone}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "Active" | "Inactive" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        status === "Active"
          ? "bg-emerald-500 text-white"
          : "bg-slate-200 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function FilterInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Filter records..."
        className="w-full rounded-xl border border-border bg-surface-muted py-2 pr-3 pl-9 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
