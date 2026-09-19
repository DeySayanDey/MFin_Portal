"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  Pencil,
  Plus,
  Save,
  Search,
  UserRound,
  X,
} from "lucide-react";

type StaffRow = {
  empId: string;
  name: string;
  designation: string;
  mobile: string;
  email: string;
  assignment: string;
  salary: number;
  target: number;
  collected: number;
  status: "Active" | "Inactive";
};

const initialStaff: StaffRow[] = [
  {
    empId: "EMP-001",
    name: "Rajesh Patil",
    designation: "Branch Manager",
    mobile: "+91 98220 11223",
    email: "rajesh.patil@ezimicro.in",
    assignment: "All Branch Centres",
    salary: 65000,
    target: 1500000,
    collected: 1284500,
    status: "Active",
  },
  {
    empId: "EMP-002",
    name: "Sachin Shinde",
    designation: "Field Officer",
    mobile: "+91 98221 44556",
    email: "sachin.shinde@ezimicro.in",
    assignment: "Gandhinagar Kendra 01, Uchgaon Kendra 02",
    salary: 28000,
    target: 600000,
    collected: 543210,
    status: "Active",
  },
  {
    empId: "EMP-003",
    name: "Pooja Deshmukh",
    designation: "Credit Underwriter",
    mobile: "+91 98222 33445",
    email: "pooja.deshmukh@ezimicro.in",
    assignment: "Underwriting Committee Desk",
    salary: 42000,
    target: 0,
    collected: 0,
    status: "Active",
  },
  {
    empId: "EMP-004",
    name: "Amol Kulkarni",
    designation: "Branch Accountant",
    mobile: "+91 98223 55667",
    email: "amol.kulkarni@ezimicro.in",
    assignment: "Accounts & Cash Counter",
    salary: 38000,
    target: 0,
    collected: 0,
    status: "Active",
  },
  {
    empId: "EMP-005",
    name: "Ramesh Patil",
    designation: "Field Officer",
    mobile: "+91 98227 10029",
    email: "ramesh.patil@ezimicro.in",
    assignment: "Kendra #001",
    salary: 26000,
    target: 450000,
    collected: 412000,
    status: "Active",
  },
  {
    empId: "EMP-006",
    name: "Vijay Banerjee",
    designation: "Field Officer",
    mobile: "+91 98225 10058",
    email: "vijay.banerjee@ezimicro.in",
    assignment: "Kendra #002",
    salary: 26000,
    target: 450000,
    collected: 398500,
    status: "Active",
  },
  {
    empId: "EMP-007",
    name: "Suresh Ghosh",
    designation: "Branch Accountant",
    mobile: "+91 98223 10087",
    email: "suresh.ghosh@ezimicro.in",
    assignment: "Kendra #003",
    salary: 35000,
    target: 0,
    collected: 0,
    status: "Active",
  },
  {
    empId: "EMP-008",
    name: "Deepak Dutta",
    designation: "Field Officer",
    mobile: "+91 98221 10116",
    email: "deepak.dutta@ezimicro.in",
    assignment: "Kendra #004",
    salary: 25500,
    target: 420000,
    collected: 401200,
    status: "Active",
  },
  {
    empId: "EMP-009",
    name: "Rahul Saha",
    designation: "Field Officer",
    mobile: "+91 98228 10145",
    email: "rahul.saha@ezimicro.in",
    assignment: "Kendra #005",
    salary: 25500,
    target: 420000,
    collected: 387900,
    status: "Active",
  },
  {
    empId: "EMP-010",
    name: "Anand Jadhav",
    designation: "Branch Manager",
    mobile: "+91 98226 10174",
    email: "anand.jadhav@ezimicro.in",
    assignment: "Kendra #006",
    salary: 58000,
    target: 1200000,
    collected: 1104500,
    status: "Active",
  },
];

const designations = [
  "Branch Manager",
  "Field Officer",
  "Credit Underwriter",
  "Branch Accountant",
  "Cashier",
  "Vault Custodian",
];

const emptyForm = {
  empId: "",
  name: "",
  designation: "Field Officer",
  mobile: "",
  email: "",
  assignment: "",
  salary: 28000,
  target: 600000,
  aadhaar: "",
  pan: "",
  joinDate: "2026-09-12",
};

type DetailMode = "none" | "performance" | "attendance";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function StaffMasterView() {
  const [staff, setStaff] = useState<StaffRow[]>(initialStaff);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailMode, setDetailMode] = useState<DetailMode>("none");
  const [selected, setSelected] = useState<StaffRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return staff;
    return staff.filter(
      (row) =>
        row.empId.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.designation.toLowerCase().includes(q) ||
        row.assignment.toLowerCase().includes(q) ||
        row.mobile.toLowerCase().includes(q),
    );
  }, [staff, query]);

  const totals = useMemo(
    () => ({
      total: staff.length,
      field: staff.filter((row) => row.designation === "Field Officer").length,
      managers: staff.filter((row) => row.designation === "Branch Manager")
        .length,
      target: staff.reduce((sum, row) => sum + row.target, 0),
    }),
    [staff],
  );

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      empId: `EMP-${String(staff.length + 1).padStart(3, "0")}`,
      mobile: "+91 ",
    });
    setModalOpen(true);
  }

  function openEdit(row: StaffRow) {
    setEditingId(row.empId);
    setForm({
      empId: row.empId,
      name: row.name,
      designation: row.designation,
      mobile: row.mobile,
      email: row.email,
      assignment: row.assignment,
      salary: row.salary,
      target: row.target,
      aadhaar: "XXXX-XXXX-XXXX",
      pan: "ABCDE1234F",
      joinDate: "2026-01-15",
    });
    setModalOpen(true);
  }

  function saveStaff() {
    if (!form.empId.trim() || !form.name.trim()) return;

    const next: StaffRow = {
      empId: form.empId.trim(),
      name: form.name.trim(),
      designation: form.designation,
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      assignment: form.assignment.trim(),
      salary: Number(form.salary) || 0,
      target: Number(form.target) || 0,
      collected:
        staff.find((row) => row.empId === editingId)?.collected ??
        Math.round((Number(form.target) || 0) * 0.85),
      status: "Active",
    };

    setStaff((prev) => {
      if (editingId) {
        return prev.map((row) => (row.empId === editingId ? next : row));
      }
      return [next, ...prev];
    });
    setModalOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex justify-end">
        <button type="button" onClick={openCreate} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Staff" value={String(totals.total)} tone="bg-blue-50 text-blue-700" />
        <StatCard label="Field Officers" value={String(totals.field)} tone="bg-emerald-50 text-emerald-700" />
        <StatCard label="Branch Managers" value={String(totals.managers)} tone="bg-violet-50 text-violet-700" />
        <StatCard label="Collection Target" value={formatInr(totals.target)} tone="bg-amber-50 text-amber-700" />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Employee Directory
            </h2>
            <p className="mt-1 text-sm text-muted">
              Click Attendance or Performance to view detailed records for each
              staff member
            </p>
          </div>
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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3 font-semibold">Emp ID</th>
                <th className="pb-3 pr-3 font-semibold">Staff Name</th>
                <th className="pb-3 pr-3 font-semibold">Designation</th>
                <th className="pb-3 pr-3 font-semibold">Mobile</th>
                <th className="pb-3 pr-3 font-semibold">Assignment</th>
                <th className="pb-3 pr-3 font-semibold">Salary</th>
                <th className="pb-3 pr-3 font-semibold">Target / Collected</th>
                <th className="pb-3 pr-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.empId}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      {row.empId}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.name}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">
                    {row.designation}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                    {row.mobile}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.assignment}</td>
                  <td className="py-3.5 pr-3 font-semibold tabular-nums text-slate-800">
                    {formatInr(row.salary)}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">
                    {row.target > 0 ? (
                      <span>
                        {formatInr(row.collected)}{" "}
                        <span className="text-muted">
                          / {formatInr(row.target)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(row);
                          setDetailMode("performance");
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Performance
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(row);
                          setDetailMode("attendance");
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Attendance
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-muted">
          Showing {filtered.length} of 114 total staff records
        </p>
      </section>

      {modalOpen ? (
        <StaffModal
          editing={Boolean(editingId)}
          form={form}
          onChange={(key, value) =>
            setForm((prev) => ({ ...prev, [key]: value }))
          }
          onClose={() => setModalOpen(false)}
          onSave={saveStaff}
        />
      ) : null}

      {detailMode !== "none" && selected ? (
        <DetailModal
          mode={detailMode}
          staff={selected}
          onClose={() => {
            setDetailMode("none");
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}

function StaffModal({
  editing,
  form,
  onChange,
  onClose,
  onSave,
}: {
  editing: boolean;
  form: typeof emptyForm;
  onChange: (key: keyof typeof emptyForm, value: string | number) => void;
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
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? "Edit Staff Member" : "Add Staff Member"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Configure employee details, designation, salary structure, and
              collection target
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Employee ID *">
              <input
                value={form.empId}
                onChange={(event) => onChange("empId", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Full Name *">
              <input
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="e.g. Vikas Kadam"
                className={inputClass}
              />
            </Field>
            <Field label="Designation">
              <select
                value={form.designation}
                onChange={(event) =>
                  onChange("designation", event.target.value)
                }
                className={inputClass}
              >
                {designations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mobile">
              <input
                value={form.mobile}
                onChange={(event) => onChange("mobile", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Join Date">
              <input
                type="date"
                value={form.joinDate}
                onChange={(event) => onChange("joinDate", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Aadhaar (Masked)">
              <input
                value={form.aadhaar}
                onChange={(event) => onChange("aadhaar", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="PAN">
              <input
                value={form.pan}
                onChange={(event) => onChange("pan", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Monthly Salary (₹)">
              <input
                type="number"
                value={form.salary}
                onChange={(event) =>
                  onChange("salary", Number(event.target.value) || 0)
                }
                className={inputClass}
              />
            </Field>
            <Field label="Collection Target (₹)">
              <input
                type="number"
                value={form.target}
                onChange={(event) =>
                  onChange("target", Number(event.target.value) || 0)
                }
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Assignment / Kendra">
                <input
                  value={form.assignment}
                  onChange={(event) =>
                    onChange("assignment", event.target.value)
                  }
                  placeholder="Gandhinagar Kendra 01"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-soft">
              Module Access
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "LMS — Collection & Receipts",
                "LOS — Sanction & Disburse",
                "Accounting — Full Access",
                "Dashboard — View Only",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="btn-actions border-t border-border bg-slate-50/80 px-5 py-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onSave} className="btn btn-primary">
            <Save className="h-4 w-4" />
            Save Staff
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({
  mode,
  staff,
  onClose,
}: {
  mode: "performance" | "attendance";
  staff: StaffRow;
  onClose: () => void;
}) {
  const months = [
    { label: "May", value: 512000 },
    { label: "Jun", value: 490000 },
    { label: "Jul", value: 555000 },
    { label: "Aug", value: 524000 },
    { label: "Sep", value: staff.collected || 543210 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "performance"
                ? "Collection Performance"
                : "Attendance Calendar"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {staff.name} · {staff.designation} · {staff.assignment}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {mode === "performance" ? (
            <>
              <div className="mb-4 rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-soft">
                  Target
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatInr(staff.target || 600000)}
                </p>
                <p className="mt-1 text-sm text-emerald-600">
                  Collected MTD: {formatInr(staff.collected || 543210)}
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {months.map((month) => (
                  <div
                    key={month.label}
                    className="rounded-xl border border-border bg-white p-2 text-center"
                  >
                    <p className="text-[11px] font-semibold text-muted">
                      {month.label}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      ₹{(month.value / 1000).toFixed(0)}k
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                September 2026
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                <Legend color="bg-emerald-500" label="Present" />
                <Legend color="bg-rose-500" label="Absent" />
                <Legend color="bg-slate-300" label="Weekend" />
                <Legend color="bg-blue-500" label="Today" />
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 30 }, (_, index) => {
                  const day = index + 1;
                  const weekend = day % 7 === 0 || day % 7 === 6;
                  const absent = day === 8 || day === 19;
                  const today = day === 15;
                  return (
                    <div
                      key={day}
                      className={`flex h-9 items-center justify-center rounded-lg text-xs font-semibold text-white ${
                        today
                          ? "bg-blue-500"
                          : absent
                            ? "bg-rose-500"
                            : weekend
                              ? "bg-slate-300 text-slate-600"
                              : "bg-emerald-500"
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="btn-actions border-t border-border bg-slate-50/80 px-5 py-4">
          <button type="button" onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <UserRound className="h-4 w-4 opacity-70" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
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
