"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Pencil,
  Plus,
  Power,
  Search,
  Table2,
  X,
} from "lucide-react";

type CalcEngine = "reduced" | "flat" | "special" | "balloon" | "manual";

type SchemeRow = {
  code: string;
  name: string;
  rate: string;
  engine: string;
  frequency: string;
  min: string;
  max: string;
  fee: string;
  status: "Active" | "Inactive";
};

type SchemeFormState = {
  code: string;
  name: string;
  description: string;
  calculation: string;
  frequency: string;
  annualRate: number;
  minPrincipal: number;
  maxPrincipal: number;
  minTenure: number;
  maxTenure: number;
  processingFee: number;
  insuranceFee: number;
  gstFee: number;
  allowJlg: boolean;
  allowIndividual: boolean;
};

const engines: { id: CalcEngine; label: string }[] = [
  { id: "reduced", label: "Reduced (EMI)" },
  { id: "flat", label: "Normal (Flat)" },
  { id: "special", label: "Special (Reducing)" },
  { id: "balloon", label: "Custom (Balloon)" },
  { id: "manual", label: "Manual" },
];

const calculationOptions = [
  "Reduced Plan (EMI Amortization)",
  "Normal Plan (Flat)",
  "Special Plan (Reducing)",
  "Custom Plan (Balloon)",
  "Manual Plan",
];

const frequencyOptions = ["Daily", "Weekly", "Fortnightly", "Monthly"];

const initialSchemes: SchemeRow[] = [
  {
    code: "IND-DAILY-01",
    name: "Daily Micro-Merchant Working Capital",
    rate: "24% p.a.",
    engine: "Normal Plan (Flat)",
    frequency: "Daily",
    min: "₹5,000",
    max: "₹20,000",
    fee: "2% + GST",
    status: "Active",
  },
  {
    code: "IND-SOLAR-01",
    name: "Clean Energy & Solar Home Loan",
    rate: "18.5% p.a.",
    engine: "Reduced Plan (EMI)",
    frequency: "Monthly",
    min: "₹20,000",
    max: "₹50,000",
    fee: "1.5% + GST",
    status: "Active",
  },
  {
    code: "JLG-AGRI-01",
    name: "Mahila Krishi & Dairy Loan",
    rate: "21.5% p.a.",
    engine: "Reduced Plan (EMI)",
    frequency: "Monthly",
    min: "₹15,000",
    max: "₹80,000",
    fee: "1% + GST",
    status: "Active",
  },
  {
    code: "IND-ART-01",
    name: "Artisan & Handloom Working Capital",
    rate: "22% p.a.",
    engine: "Special (Reducing)",
    frequency: "Weekly",
    min: "₹10,000",
    max: "₹35,000",
    fee: "1.25% + GST",
    status: "Active",
  },
];

const defaultForm: SchemeFormState = {
  code: "SCHEME-05",
  name: "",
  description: "",
  calculation: "Reduced Plan (EMI Amortization)",
  frequency: "Monthly",
  annualRate: 22,
  minPrincipal: 20000,
  maxPrincipal: 75000,
  minTenure: 12,
  maxTenure: 24,
  processingFee: 1.5,
  insuranceFee: 1,
  gstFee: 18,
  allowJlg: true,
  allowIndividual: false,
};

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatInrExact(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function buildSchedule(
  principal: number,
  annualRate: number,
  tenure: number,
  engine: CalcEngine,
) {
  const months = Math.max(1, tenure);
  const monthlyRate = annualRate / 12 / 100;

  if (engine === "flat" || engine === "balloon") {
    const totalInterest = principal * (annualRate / 100) * (months / 12);
    const totalRepayable = principal + totalInterest;
    const installment =
      engine === "balloon"
        ? (principal * 0.7 + totalInterest) / months
        : totalRepayable / months;
    const principalPer = principal / months;
    const interestPer = totalInterest / months;

    let balance = principal;
    const rows = Array.from({ length: Math.min(months, 12) }, (_, index) => {
      const opening = balance;
      const principalPart =
        engine === "balloon" && index === months - 1
          ? balance
          : Math.min(principalPer, balance);
      const interestPart = interestPer;
      const totalDue =
        engine === "balloon" && index === months - 1
          ? principalPart + interestPart
          : installment;
      balance = Math.max(0, balance - principalPart);
      return {
        inst: index + 1,
        opening,
        principal: principalPart,
        interest: interestPart,
        totalDue,
        closing: balance,
      };
    });

    return {
      installment,
      totalInstallments: months,
      totalInterest,
      totalRepayable,
      rows,
      interestLabel: engine === "flat" ? "Flat" : "Balloon",
    };
  }

  // Reducing / EMI / Special reducing
  const emi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  let balance = principal;
  let totalInterest = 0;
  const rows = [];

  for (let i = 0; i < months; i += 1) {
    const opening = balance;
    const interestPart = balance * monthlyRate;
    const principalPart = Math.min(emi - interestPart, balance);
    const closing = Math.max(0, balance - principalPart);
    totalInterest += interestPart;
    if (i < 12) {
      rows.push({
        inst: i + 1,
        opening,
        principal: principalPart,
        interest: interestPart,
        totalDue: principalPart + interestPart,
        closing,
      });
    }
    balance = closing;
  }

  return {
    installment: emi,
    totalInstallments: months,
    totalInterest,
    totalRepayable: principal + totalInterest,
    rows,
    interestLabel: "Reducing",
  };
}

export function LoanSchemesView() {
  const [engine, setEngine] = useState<CalcEngine>("reduced");
  const [principal, setPrincipal] = useState(48000);
  const [rate, setRate] = useState(21.5);
  const [tenure, setTenure] = useState(12);
  const [cadence, setCadence] = useState("Monthly");
  const [query, setQuery] = useState("");
  const [schemes, setSchemes] = useState<SchemeRow[]>(initialSchemes);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SchemeFormState>(defaultForm);

  const calc = useMemo(
    () => buildSchedule(principal, rate, tenure, engine),
    [principal, rate, tenure, engine],
  );

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  const filteredSchemes = schemes.filter((scheme) => {
    const q = query.toLowerCase();
    return (
      scheme.code.toLowerCase().includes(q) ||
      scheme.name.toLowerCase().includes(q) ||
      scheme.engine.toLowerCase().includes(q)
    );
  });

  function openCreateModal() {
    const nextCode = `SCHEME-${String(schemes.length + 1).padStart(2, "0")}`;
    setForm({ ...defaultForm, code: nextCode });
    setModalOpen(true);
  }

  function updateForm<K extends keyof SchemeFormState>(
    key: K,
    value: SchemeFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function saveScheme() {
    if (!form.code.trim() || !form.name.trim()) return;

    const feeLabel = `${form.processingFee}% + GST`;
    const engineLabel =
      form.calculation
        .replace(" Amortization", "")
        .replace(" Plan", " Plan")
        .trim() || form.calculation;

    setSchemes((prev) => [
      {
        code: form.code.trim(),
        name: form.name.trim(),
        rate: `${form.annualRate}% p.a.`,
        engine: engineLabel,
        frequency: form.frequency,
        min: formatInr(form.minPrincipal),
        max: formatInr(form.maxPrincipal),
        fee: feeLabel,
        status: "Active",
      },
      ...prev,
    ]);
    setModalOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Configurable Lending Schemes & Pricing Models
          </h1>
          <p className="mt-1 text-sm text-muted">
            Design interest engines, repayment cadences, fee packs, and live
            amortization previews for every microfinance product.
          </p>
        </div>
        <button type="button" onClick={openCreateModal} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Create New Loan Plan
        </button>
      </div>

      {/* Calculator */}
      <section className="rounded-2xl bg-slate-900 p-4 text-white shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Interactive Loan Pricing Calculator
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Real-time EMI / flat / reducing estimators with schedule preview.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-800 p-1">
            {engines.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEngine(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  engine === item.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CalcField
            label="Principal Amount (₹)"
            type="number"
            value={principal}
            onChange={(value) => setPrincipal(Number(value) || 0)}
          />
          <CalcField
            label="Annual Interest Rate (%)"
            type="number"
            value={rate}
            step="0.1"
            onChange={(value) => setRate(Number(value) || 0)}
          />
          <CalcField
            label="Tenure (Months)"
            type="number"
            value={tenure}
            onChange={(value) => setTenure(Number(value) || 1)}
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">
              Repayment Cadence
            </span>
            <select
              value={cadence}
              onChange={(event) => setCadence(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Fortnightly</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <ResultTile
            label="Installment Amount"
            value={formatInr(calc.installment)}
            note={`per ${cadence.toLowerCase().replace(/ly$/, "") || "period"}`}
            valueClass="text-emerald-400"
          />
          <ResultTile
            label="Total Installments"
            value={String(calc.totalInstallments)}
            note={`${cadence} payments`}
            valueClass="text-white"
          />
          <ResultTile
            label="Total Interest"
            value={formatInr(calc.totalInterest)}
            note={calc.interestLabel}
            valueClass="text-amber-300"
          />
          <ResultTile
            label="Total Repayable"
            value={formatInr(calc.totalRepayable)}
            note="Principal + Interest"
            valueClass="text-white"
          />
        </div>

        <div className="mt-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Repayment Schedule Preview (First 12 Installments)
            </h3>
            <button
              type="button"
              className="w-fit text-xs font-semibold text-sky-300 transition hover:text-sky-200"
            >
              Amortization breakdown
            </button>
          </div>
          <div className="table-scroll rounded-xl border border-slate-700">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="bg-slate-800 text-[11px] uppercase tracking-[0.12em] text-slate-300">
                  <th className="px-3 py-2.5 font-semibold">Inst #</th>
                  <th className="px-3 py-2.5 font-semibold">Opening Balance</th>
                  <th className="px-3 py-2.5 font-semibold">Principal</th>
                  <th className="px-3 py-2.5 font-semibold">Interest</th>
                  <th className="px-3 py-2.5 font-semibold">Total Due</th>
                  <th className="px-3 py-2.5 font-semibold">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {calc.rows.map((row) => (
                  <tr
                    key={row.inst}
                    className="border-t border-slate-700/80 text-slate-200"
                  >
                    <td className="px-3 py-2.5 font-medium">{row.inst}</td>
                    <td className="px-3 py-2.5">
                      {formatInrExact(row.opening)}
                    </td>
                    <td className="px-3 py-2.5 text-emerald-400">
                      {formatInrExact(row.principal)}
                    </td>
                    <td className="px-3 py-2.5 text-amber-300">
                      {formatInrExact(row.interest)}
                    </td>
                    <td className="px-3 py-2.5 font-semibold">
                      {formatInrExact(row.totalDue)}
                    </td>
                    <td className="px-3 py-2.5">
                      {formatInrExact(row.closing)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Schemes table */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Configured Microfinance Loan Product Schemes
            </h2>
            <p className="mt-1 text-sm text-muted">
              Active pricing packs with fee, GST, and repayment frequency
              controls.
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
                <th className="pb-3 pr-3 font-semibold">Scheme Code</th>
                <th className="pb-3 pr-3 font-semibold">Loan Scheme Name</th>
                <th className="pb-3 pr-3 font-semibold">Interest Rate</th>
                <th className="pb-3 pr-3 font-semibold">Calculation Engine</th>
                <th className="pb-3 pr-3 font-semibold">Frequency</th>
                <th className="pb-3 pr-3 font-semibold">Min Limit</th>
                <th className="pb-3 pr-3 font-semibold">Max Limit</th>
                <th className="pb-3 pr-3 font-semibold">Fee + GST</th>
                <th className="pb-3 pr-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.map((scheme) => (
                <tr
                  key={scheme.code}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-3 font-mono text-xs font-semibold text-blue-700">
                    {scheme.code}
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {scheme.name}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{scheme.rate}</td>
                  <td className="py-3.5 pr-3 text-slate-700">{scheme.engine}</td>
                  <td className="py-3.5 pr-3 text-slate-700">
                    {scheme.frequency}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                    {scheme.min}
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-[13px] text-slate-700">
                    {scheme.max}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{scheme.fee}</td>
                  <td className="py-3.5 pr-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        scheme.status === "Active"
                          ? "bg-brand-soft text-brand-ink"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {scheme.status}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-blue-700"
                      >
                        <Table2 className="h-3.5 w-3.5" />
                        Amortization Table
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSchemes((prev) =>
                            prev.map((row) =>
                              row.code === scheme.code
                                ? {
                                    ...row,
                                    status:
                                      row.status === "Active"
                                        ? "Inactive"
                                        : "Active",
                                  }
                                : row,
                            ),
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-muted px-2 py-1.5 text-[11px] font-semibold text-slate-600"
                      >
                        <Power className="h-3.5 w-3.5" />
                        Toggle Status
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-muted px-2 py-1.5 text-[11px] font-semibold text-slate-600"
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
      </section>

      {modalOpen ? (
        <CreateSchemeModal
          form={form}
          onChange={updateForm}
          onClose={() => setModalOpen(false)}
          onSave={saveScheme}
        />
      ) : null}
    </div>
  );
}

function CreateSchemeModal({
  form,
  onChange,
  onClose,
  onSave,
}: {
  form: SchemeFormState;
  onChange: <K extends keyof SchemeFormState>(
    key: K,
    value: SchemeFormState[K],
  ) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const canSave = form.code.trim().length > 0 && form.name.trim().length > 0;

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
        aria-labelledby="create-scheme-title"
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2
              id="create-scheme-title"
              className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
            >
              Create New Microfinance Loan Scheme
            </h2>
            <p className="mt-1 text-sm text-muted">
              Configure 5 calculation engines, limits, processing fee
              percentages, and GST rates
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

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModalField label="Scheme Code" required>
              <input
                value={form.code}
                onChange={(event) => onChange("code", event.target.value)}
                className={modalInputClass}
              />
            </ModalField>
            <ModalField label="Scheme Name" required>
              <input
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="e.g. Mahila Krishi Vikas Loan"
                className={modalInputClass}
              />
            </ModalField>
          </div>

          <div className="mt-4">
            <ModalField label="Scheme Description">
              <input
                value={form.description}
                onChange={(event) =>
                  onChange("description", event.target.value)
                }
                placeholder="Short description of scheme purpose"
                className={modalInputClass}
              />
            </ModalField>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-3 sm:p-4">
            <ModalField label="Interest Calculation">
              <select
                value={form.calculation}
                onChange={(event) =>
                  onChange("calculation", event.target.value)
                }
                className={`${modalInputClass} text-violet-700`}
              >
                {calculationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Repayment Frequency">
              <select
                value={form.frequency}
                onChange={(event) => onChange("frequency", event.target.value)}
                className={modalInputClass}
              >
                {frequencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Annual Interest Rate (%)">
              <input
                type="number"
                step="0.1"
                value={form.annualRate}
                onChange={(event) =>
                  onChange("annualRate", Number(event.target.value) || 0)
                }
                className={modalInputClass}
              />
            </ModalField>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModalField label="Min Principal Limit (₹)">
              <input
                type="number"
                value={form.minPrincipal}
                onChange={(event) =>
                  onChange("minPrincipal", Number(event.target.value) || 0)
                }
                className={modalInputClass}
              />
            </ModalField>
            <ModalField label="Max Principal Limit (₹)">
              <input
                type="number"
                value={form.maxPrincipal}
                onChange={(event) =>
                  onChange("maxPrincipal", Number(event.target.value) || 0)
                }
                className={modalInputClass}
              />
            </ModalField>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ModalField label="Min Tenure (Months)">
              <input
                type="number"
                value={form.minTenure}
                onChange={(event) =>
                  onChange("minTenure", Number(event.target.value) || 0)
                }
                className={modalInputClass}
              />
            </ModalField>
            <ModalField label="Max Tenure (Months)">
              <input
                type="number"
                value={form.maxTenure}
                onChange={(event) =>
                  onChange("maxTenure", Number(event.target.value) || 0)
                }
                className={modalInputClass}
              />
            </ModalField>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-sky-50/80 p-3 sm:grid-cols-3 sm:p-4">
            <ModalField label="Processing Fee (%)">
              <input
                type="number"
                step="0.1"
                value={form.processingFee}
                onChange={(event) =>
                  onChange("processingFee", Number(event.target.value) || 0)
                }
                className={modalInputClass}
              />
            </ModalField>
            <ModalField label="Insurance Fee (%)">
              <input
                type="number"
                step="0.1"
                value={form.insuranceFee}
                onChange={(event) =>
                  onChange("insuranceFee", Number(event.target.value) || 0)
                }
                className={modalInputClass}
              />
            </ModalField>
            <ModalField label="GST on Fees (%)">
              <input
                type="number"
                step="0.1"
                value={form.gstFee}
                onChange={(event) =>
                  onChange("gstFee", Number(event.target.value) || 0)
                }
                className={modalInputClass}
              />
            </ModalField>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={form.allowJlg}
                onChange={(event) =>
                  onChange("allowJlg", event.target.checked)
                }
                className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
              />
              Allowed for JLG / Group Loans
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={form.allowIndividual}
                onChange={(event) =>
                  onChange("allowIndividual", event.target.checked)
                }
                className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
              />
              Allowed for Individual Loans
            </label>
          </div>
        </div>

        <div className="btn-actions border-t border-border bg-slate-50/80 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={onSave}
            className="btn btn-primary"
          >
            <Check className="h-4 w-4" />
            Save Loan Scheme
          </button>
        </div>
      </div>
    </div>
  );
}

const modalInputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

function ModalField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function CalcField({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-300">
        {label}
      </span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
      />
    </label>
  );
}

function ResultTile({
  label,
  value,
  note,
  valueClass,
}: {
  label: string;
  value: string;
  note: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-800/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </div>
  );
}
