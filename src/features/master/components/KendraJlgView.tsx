"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  GitBranch,
  MapPin,
  Network,
  Plus,
  Search,
} from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { KendraCenterMasterTab } from "@/features/master/center/components/KendraCenterMasterTab";
import type { Branch } from "@/features/master/branch/types/branch.types";
import type { Center } from "@/features/master/center/types/center.types";

type TabId = "kendras" | "jlg" | "org";

type OrgBranch = {
  id: number;
  code: string;
  name: string;
  detail: string;
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
  { id: "kendras", label: "Kendra Centres", icon: MapPin },
  { id: "org", label: "Org Chart", icon: Network },
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
  const [activeTab, setActiveTab] = useState<TabId>("kendras");
  const [liveBranches, setLiveBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (activeTab !== "org") return;
    let cancelled = false;
    fetchBranchList({ page: 1, perPage: 200 })
      .then((result) => {
        if (!cancelled) setLiveBranches(result.items);
      })
      .catch(() => {
        if (!cancelled) setLiveBranches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);
  const [liveCenters, setLiveCenters] = useState<Center[]>([]);
  const [jlgs] = useState<JlgRow[]>(initialJlgs);
  const [query, setQuery] = useState("");

  const orgBranches = useMemo<OrgBranch[]>(
    () =>
      liveBranches.map((branch) => ({
        id: branch.branchId,
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
      jlgs: jlgs.length,
    }),
    [jlgs],
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
                  : "text-slate-500 hover:bg-surface-muted hover:text-slate-700"
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

      {activeTab === "kendras" ? (
        <KendraCenterMasterTab onCentersChange={setLiveCenters} />
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
          centers={liveCenters}
          jlgs={jlgs}
        />
      ) : null}
    </div>
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
  const jlgColumns: DataTableColumn<JlgRow>[] = [
    {
      id: "code",
      header: "Group Code",
      cell: (row) => (
        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
          {row.code}
        </span>
      ),
    },
    {
      id: "name",
      header: "Group Name",
      cell: (row) => (
        <span className="font-medium text-slate-800">{row.name}</span>
      ),
    },
    {
      id: "kendra",
      header: "Kendra",
      cell: (row) => row.kendra,
    },
    {
      id: "leader",
      header: "Leader",
      cell: (row) => row.leader,
    },
    {
      id: "members",
      header: "Members",
      cell: (row) => (
        <span className="font-semibold tabular-nums">{row.members}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge tone={row.status === "Active" ? "success" : "neutral"} caps>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <Button type="button" icon={Plus}>
          Add JLG Group
        </Button>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            JLG Group Directory
          </h2>
          <p className="mt-1 text-sm text-muted">
            Group codes, parent kendra, and membership
          </p>
        </div>
        <label className="relative block w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Filter records..."
            className="pl-9"
          />
        </label>
      </div>
      <DataTable
        data={rows}
        columns={jlgColumns}
        getRowKey={(row) => row.code}
        minWidth="860px"
      />
    </>
  );
}

function OrgChartPanel({
  branches,
  centers,
  jlgs,
}: {
  branches: OrgBranch[];
  centers: Center[];
  jlgs: JlgRow[];
}) {
  return (
    <div className="grid gap-4">
      {branches.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          No branches found. Add branches in Branch Master.
        </p>
      ) : null}
      {branches.map((branch) => {
        const branchCenters = centers.filter(
          (center) => center.branchId === branch.id,
        );
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
              {branchCenters.length === 0 ? (
                <p className="text-xs text-muted">
                  No kendra centres loaded for this branch. Open the Kendra
                  Centres tab to refresh.
                </p>
              ) : null}
              {branchCenters.map((center) => {
                const groups = jlgs.filter(
                  (g) => g.kendra === center.centerName,
                );
                return (
                  <div
                    key={center.centerId}
                    className="rounded-xl bg-slate-50 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <MapPin className="h-4 w-4 text-violet-600" />
                      <p className="text-sm font-semibold text-slate-800">
                        {center.centerName}
                      </p>
                      {!center.isActive ? (
                        <Badge tone="neutral" caps>
                          Inactive
                        </Badge>
                      ) : null}
                    </div>
                    {center.centerAddress ? (
                      <p className="mt-1 text-xs text-muted">
                        {center.centerAddress}
                      </p>
                    ) : null}
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
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p
        className={`mt-2 inline-flex rounded-xl px-2.5 py-1 text-lg font-semibold ${tone}`}
      >
        {value}
      </p>
    </div>
  );
}
