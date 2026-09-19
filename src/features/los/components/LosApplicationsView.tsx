"use client";

import { useMemo, useState } from "react";
import {
  Diamond,
  FileText,
  Grid2X2,
  Search,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  BulkNeftModal,
  CollateralPdcModal,
  GuaranteeMatrixModal,
  IndividualLoanModal,
  JlgGroupLoanModal,
  SanctionKfsModal,
  type LosLoanApp,
} from "@/features/los/components/LosModals";

const applications: LosLoanApp[] = [
  {
    appNumber: "APP-2026-00120",
    borrower: "Gita Saha",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 50000,
    score: 750,
    risk: "Low Risk",
    feeGst: 1475,
    netDisbursal: 48525,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00119",
    borrower: "Anjali Chakraborty",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 45000,
    score: 732,
    risk: "Low Risk",
    feeGst: 1327.5,
    netDisbursal: 43672.5,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00118",
    borrower: "Aparna Sen",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 40000,
    score: 718,
    risk: "Low Risk",
    feeGst: 1180,
    netDisbursal: 38820,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00117",
    borrower: "Mousumi Ghosh",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 35000,
    score: 705,
    risk: "Low Risk",
    feeGst: 1032.5,
    netDisbursal: 33967.5,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00116",
    borrower: "Supriya Mondal",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 40000,
    score: 745,
    risk: "Low Risk",
    feeGst: 1180,
    netDisbursal: 38820,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00115",
    borrower: "Ruma More",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 30000,
    score: 690,
    risk: "Fair",
    feeGst: 885,
    netDisbursal: 29115,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00114",
    borrower: "Meena Patil",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 42000,
    score: 728,
    risk: "Low Risk",
    feeGst: 1239,
    netDisbursal: 40761,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00113",
    borrower: "Pooja Gaikwad",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 28000,
    score: 684,
    risk: "Fair",
    feeGst: 826,
    netDisbursal: 27174,
    status: "Sanctioned",
  },
  {
    appNumber: "APP-2026-00112",
    borrower: "Aarti Saha",
    scheme: "Mahila Krishi & Dairy Loan",
    applied: 38000,
    score: 710,
    risk: "Low Risk",
    feeGst: 1121,
    netDisbursal: 36879,
    status: "Disbursed",
  },
  {
    appNumber: "APP-2026-00111",
    borrower: "Kavita Chakraborty",
    scheme: "Gramin Micro Enterprise Loan",
    applied: 32000,
    score: 698,
    risk: "Fair",
    feeGst: 944,
    netDisbursal: 31056,
    status: "Under Appraisal",
  },
];

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

type ModalKind =
  | "collateral"
  | "sanction"
  | "bulkNeft"
  | "guarantee"
  | "jlg"
  | "individual"
  | null;

export function LosApplicationsView() {
  const [query, setQuery] = useState("");
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const [selectedApp, setSelectedApp] = useState<LosLoanApp | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (row) =>
        row.appNumber.toLowerCase().includes(q) ||
        row.borrower.toLowerCase().includes(q) ||
        row.scheme.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q),
    );
  }, [query]);

  function openAppModal(kind: "collateral" | "sanction", app: LosLoanApp) {
    setSelectedApp(app);
    setActiveModal(kind);
  }

  function closeModal() {
    setActiveModal(null);
    setSelectedApp(null);
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="success"
          icon={Wallet}
          onClick={() => setActiveModal("bulkNeft")}
        >
          Bulk NEFT Disbursal
        </Button>
        <Button
          variant="violet"
          icon={Grid2X2}
          onClick={() => setActiveModal("guarantee")}
        >
          Guarantee Matrix
        </Button>
        <Button icon={Users} onClick={() => setActiveModal("jlg")}>
          Apply JLG Group Loan
        </Button>
        <Button
          variant="secondary"
          icon={UserPlus}
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={() => setActiveModal("individual")}
        >
          Individual App
        </Button>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Active Loan Origination Pipeline
            </h2>
            <p className="mt-1 text-sm text-muted">
              Underwriting status, upfront fee deductions, and one-click
              sanction committee actions
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter records..."
              className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pr-3 pl-9 text-sm outline-none focus:border-brand/40 focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-soft">
                <th className="pb-3 pr-3">App Number</th>
                <th className="pb-3 pr-3">Borrower</th>
                <th className="pb-3 pr-3">Product Scheme</th>
                <th className="pb-3 pr-3 text-right">Applied Amount</th>
                <th className="pb-3 pr-3 text-center">Bureau Score</th>
                <th className="pb-3 pr-3 text-right">Fee + GST</th>
                <th className="pb-3 pr-3 text-right">Net Disbursal</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.appNumber} className="border-t border-border/70">
                  <td className="py-3.5 pr-3 font-semibold text-slate-900">
                    {row.appNumber}
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-800">
                    {row.borrower}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-700">{row.scheme}</td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.applied)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <div className="mx-auto flex h-14 w-14 flex-col items-center justify-center rounded-full bg-emerald-50 text-center">
                      <span className="text-sm font-bold text-emerald-700">
                        {row.score}
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600">
                        {row.risk}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3 text-right text-slate-700">
                    {formatInr(row.feeGst)}
                  </td>
                  <td className="py-3.5 pr-3 text-right font-semibold text-slate-900">
                    {formatInr(row.netDisbursal)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <Badge
                      tone={
                        row.status === "Disbursed"
                          ? "success"
                          : row.status === "Sanctioned"
                            ? "info"
                            : "warning"
                      }
                      caps={false}
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="amber"
                        icon={Diamond}
                        onClick={() => openAppModal("collateral", row)}
                      >
                        Collateral & PDCs
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={FileText}
                        className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => openAppModal("sanction", row)}
                      >
                        Sanction Letter & KFS
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
          <p>
            Showing {filtered.length} of {applications.length} applications
          </p>
          <p>Fee + GST auto-calc · Bureau score · Net disbursal</p>
        </div>
      </section>

      <CollateralPdcModal
        open={activeModal === "collateral"}
        onClose={closeModal}
        app={selectedApp}
      />
      <SanctionKfsModal
        open={activeModal === "sanction"}
        onClose={closeModal}
        app={selectedApp}
      />
      <BulkNeftModal
        open={activeModal === "bulkNeft"}
        onClose={closeModal}
        apps={applications}
      />
      <GuaranteeMatrixModal
        open={activeModal === "guarantee"}
        onClose={closeModal}
      />
      <JlgGroupLoanModal open={activeModal === "jlg"} onClose={closeModal} />
      <IndividualLoanModal
        open={activeModal === "individual"}
        onClose={closeModal}
      />
    </div>
  );
}
