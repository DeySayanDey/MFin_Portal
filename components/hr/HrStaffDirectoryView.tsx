"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { staffDirectory } from "@/components/hr/hr-data";

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
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Staff Directory & HR
            </h1>
            <p className="mt-1 text-sm text-muted">
              Employee master, designations, branch mapping, and contact
              registry
            </p>
          </div>
        </div>
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
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter staff..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-soft">
                <th className="pb-3 pr-3">Emp ID</th>
                <th className="pb-3 pr-3">Name</th>
                <th className="pb-3 pr-3">Role</th>
                <th className="pb-3 pr-3">Branch</th>
                <th className="pb-3 pr-3">Mobile</th>
                <th className="pb-3 pr-3">Joined</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.empId} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-blue-600">
                    {row.empId}
                  </td>
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.name}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.role}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.branch}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.mobile}</td>
                  <td className="py-3.5 pr-3 text-slate-600">{row.joined}</td>
                  <td className="py-3.5">
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
