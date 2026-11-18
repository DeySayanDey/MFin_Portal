"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  staffDirectory,
  type StaffMember,
} from "@/features/hr/components/hr-data";

const staffColumns: DataTableColumn<StaffMember>[] = [
  {
    id: "empId",
    header: "Emp ID",
    cell: (row) => (
      <span className="font-semibold text-blue-600">{row.empId}</span>
    ),
  },
  {
    id: "name",
    header: "Name",
    cell: (row) => (
      <span className="font-semibold text-slate-900">{row.name}</span>
    ),
  },
  {
    id: "role",
    header: "Role",
    cell: (row) => row.role,
  },
  {
    id: "branch",
    header: "Branch",
    cell: (row) => <span className="text-slate-600">{row.branch}</span>,
  },
  {
    id: "mobile",
    header: "Mobile",
    cell: (row) => <span className="text-slate-600">{row.mobile}</span>,
  },
  {
    id: "joined",
    header: "Joined",
    cell: (row) => <span className="text-slate-600">{row.joined}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <Badge
        tone={
          row.status === "Active"
            ? "success"
            : row.status === "On Leave"
              ? "warning"
              : "info"
        }
        caps={false}
      >
        {row.status}
      </Badge>
    ),
  },
];

export function HrStaffDirectoryView() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffDirectory;
    return staffDirectory.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.empId.toLowerCase().includes(q) ||
        row.role.toLowerCase().includes(q) ||
        row.branch.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex justify-end">
        <Button icon={UserPlus}>Add Staff Member</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Active Staff",
            value: String(
              staffDirectory.filter((row) => row.status === "Active").length,
            ),
            hint: "On rolls",
          },
          {
            label: "On Leave",
            value: String(
              staffDirectory.filter((row) => row.status === "On Leave").length,
            ),
            hint: "Temporary absence",
          },
          {
            label: "Branches Covered",
            value: "5",
            hint: "Operating network",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)]"
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-soft uppercase">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs text-muted">{item.hint}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Employee Master Register
          </h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter staff..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <DataTable
          data={filtered}
          columns={staffColumns}
          getRowKey={(row) => row.empId}
          minWidth="900px"
        />
      </section>
    </div>
  );
}
