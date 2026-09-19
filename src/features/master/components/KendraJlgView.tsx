"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  GitBranch,
  MapPin,
  Network,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { KendraBranchMasterTab } from "@/features/master/branch/components/KendraBranchMasterTab";
import type { Branch } from "@/features/master/branch/types/branch.types";

type TabId = "branches" | "kendras" | "jlg" | "org";

type OrgBranch = {
  code: string;
  name: string;
  detail: string;
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
];

export function KendraJlgView() {
  const [activeTab, setActiveTab] = useState<TabId>("branches");
  const [liveBranches, setLiveBranches] = useState<Branch[]>([]);
  const [kendras] = useState<KendraRow[]>(initialKendras);
  const [jlgs] = useState<JlgRow[]>(initialJlgs);
  const [query, setQuery] = useState("");

  const orgBranches = useMemo<OrgBranch[]>(
    () =>
      liveBranches.map((branch) => ({
        code: branch.branchCode,
        name: branch.branchName,
        detail: [
          branch.branchAddress,
          branch.isHead ? "Head Office" : null,
          branch.isActive ? "Active" : "Inactive",
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [liveBranches],
  );

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
      kendras: kendras.length,
      jlgs: jlgs.length,
    }),
    [kendras, jlgs],
  );

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
        <KendraBranchMasterTab onBranchesChange={setLiveBranches} />
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
        <OrgChartPanel
          branches={orgBranches}
          kendras={kendras}
          jlgs={jlgs}
        />
      ) : null}
    </div>
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
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Add Kendra
        </button>
      </div>
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
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Add JLG Group
        </button>
      </div>
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
          label="Total Members"
          value={String(rows.reduce((sum, r) => sum + r.members, 0))}
          tone="bg-blue-50 text-blue-700"
        />
      </div>
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              JLG Group Directory
            </h2>
            <p className="mt-1 text-sm text-muted">
              Group codes, parent kendra, and membership
            </p>
          </div>
          <FilterInput value={query} onChange={onQueryChange} />
        </div>
        <div className="table-scroll">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3 font-semibold">Group Code</th>
                <th className="pb-3 pr-3 font-semibold">Group Name</th>
                <th className="pb-3 pr-3 font-semibold">Kendra</th>
                <th className="pb-3 pr-3 font-semibold">Leader</th>
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
  branches: OrgBranch[];
  kendras: KendraRow[];
  jlgs: JlgRow[];
}) {
  return (
    <>
      <div className="grid gap-4">
        {branches.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
            Open the Branch Master tab once to load live branches for the chart.
          </p>
        ) : null}
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
                    {branch.code}
                    {branch.detail ? ` · ${branch.detail}` : ""}
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
