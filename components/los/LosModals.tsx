"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  CreditCard,
  Diamond,
  FileSpreadsheet,
  ListChecks,
  Printer,
  Send,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  Modal,
  ModalBanner,
  ModalSectionTitle,
  modalFieldClass,
  modalSelectClass,
} from "@/components/ui/Modal";

export type LosLoanApp = {
  appNumber: string;
  borrower: string;
  scheme: string;
  applied: number;
  score: number;
  risk: string;
  feeGst: number;
  netDisbursal: number;
  status: string;
};

function formatInr(value: number, digits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

const tableHead =
  "bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500";
const tableCell = "border-t border-slate-100 px-3 py-2.5 text-sm text-slate-700";

/* ─── Collateral & PDC ─────────────────────────────────────────────── */

type CollateralModalProps = {
  open: boolean;
  onClose: () => void;
  app: LosLoanApp | null;
};

export function CollateralPdcModal({ open, onClose, app }: CollateralModalProps) {
  if (!app) return null;

  const assets = [
    {
      classification: "Gold Ornaments (22K)",
      description: "Necklace + Bangles — Assay Cert #GC-8821",
      market: 185000,
      distress: 148000,
      status: "PLEDGED_IN_VAULT",
    },
    {
      classification: "Dairy Cattle / Livestock",
      description: "2 Cross-bred cows — Tag #WB-DF-441",
      market: 78000,
      distress: 52000,
      status: "INSPECTED",
    },
    {
      classification: "Fixed Deposit (FD) Lien",
      description: "SBI FD A/c ****4521 — Lien marked",
      market: 45000,
      distress: 45000,
      status: "LIEN_MARKED",
    },
  ];

  const totalAssessed = assets.reduce((sum, row) => sum + row.market, 0);

  const cheques = [
    {
      number: "CHQ-890124",
      bank: "State Bank of India",
      account: "XXXX4521",
      type: "Security PDC",
    },
    {
      number: "CHQ-890125",
      bank: "State Bank of India",
      account: "XXXX4521",
      type: "EMI Backup",
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Collateral Asset & Post-Dated Cheque (PDC) Security Registry"
      subtitle="Pledged gold, livestock, property deeds, and promissory security cheques inventory."
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="space-y-5">
        <ModalBanner className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-amber-400 uppercase">
              Collateral Security Dossier
            </p>
            <p className="mt-1 text-sm font-semibold text-white sm:text-base">
              {app.appNumber} — Sanctioned: {formatInr(app.applied)} | Product:{" "}
              {app.scheme}
            </p>
          </div>
          <Button variant="warning" icon={Printer} className="shrink-0">
            Print DPN Note
          </Button>
        </ModalBanner>

        <section>
          <ModalSectionTitle
            icon={<Diamond className="h-3.5 w-3.5 text-amber-500" />}
            trailing={
              <p className="text-xs font-semibold text-slate-600">
                Total Assessed Security:{" "}
                <span className="text-emerald-600">
                  {formatInr(totalAssessed)}
                </span>
              </p>
            }
          >
            Pledged Physical Assets & Liens
          </ModalSectionTitle>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className={tableHead}>
                  <th className="px-3 py-2.5">Asset Classification</th>
                  <th className="px-3 py-2.5">Description & Identification</th>
                  <th className="px-3 py-2.5 text-right">Market Value (₹)</th>
                  <th className="px-3 py-2.5 text-right">Distress Value (₹)</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((row) => (
                  <tr key={row.classification}>
                    <td className={`${tableCell} font-semibold text-slate-900`}>
                      {row.classification}
                    </td>
                    <td className={tableCell}>{row.description}</td>
                    <td className={`${tableCell} text-right font-semibold text-slate-900`}>
                      {formatInr(row.market)}
                    </td>
                    <td className={`${tableCell} text-right font-semibold text-emerald-600`}>
                      {formatInr(row.distress)}
                    </td>
                    <td className={tableCell}>
                      <Badge tone="amber">{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <ModalSectionTitle
            icon={<CreditCard className="h-3.5 w-3.5 text-blue-500" />}
          >
            Security Post-Dated Cheques (PDC)
          </ModalSectionTitle>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className={tableHead}>
                  <th className="px-3 py-2.5">Cheque Number</th>
                  <th className="px-3 py-2.5">Drawee Bank</th>
                  <th className="px-3 py-2.5">Account Number</th>
                  <th className="px-3 py-2.5">Cheque Type</th>
                  <th className="px-3 py-2.5">Safe Status</th>
                </tr>
              </thead>
              <tbody>
                {cheques.map((row) => (
                  <tr key={row.number}>
                    <td className={`${tableCell} font-semibold text-slate-900`}>
                      {row.number}
                    </td>
                    <td className={tableCell}>{row.bank}</td>
                    <td className={tableCell}>{row.account}</td>
                    <td className={tableCell}>{row.type}</td>
                    <td className={tableCell}>
                      <Badge tone="info">HELD_IN_SAFE</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Modal>
  );
}

/* ─── Sanction Letter & KFS ────────────────────────────────────────── */

type SanctionModalProps = {
  open: boolean;
  onClose: () => void;
  app: LosLoanApp | null;
};

export function SanctionKfsModal({ open, onClose, app }: SanctionModalProps) {
  if (!app) return null;

  const emi = Math.round((app.netDisbursal / 12) * 100) / 100 + 200;
  const rows: Array<{
    label: string;
    value: string;
    tone?: "blue" | "green" | "red" | "highlight";
  }> = [
    {
      label: "Sanctioned Principal Amount",
      value: formatInr(app.applied, 2),
    },
    {
      label: "Interest Rate & Method",
      value: "21.5% p.a. (ReducingBalanceEmi)",
    },
    {
      label: "Total Cost of Credit (APR)",
      value: "24% APR",
      tone: "blue",
    },
    {
      label: "Loan Tenure & Frequency",
      value: "12 Months (12 Monthly Installments)",
    },
    {
      label: "Monthly / Scheduled Instalment (EMI)",
      value: formatInr(emi, 2),
      tone: "green",
    },
    {
      label: `Upfront Deductions (Fee + Ins. + GST)`,
      value: `- ${formatInr(app.feeGst, 2)}`,
      tone: "red",
    },
    {
      label: "Net Disbursal Amount Payable",
      value: formatInr(app.netDisbursal, 2),
      tone: "highlight",
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Official Loan Sanction Letter & Key Fact Statement (KFS)"
      subtitle="RBI Mandated Harmonized Microfinance Sanction Agreement Letter"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Close
          </Button>
          <Button icon={Printer} onClick={onClose}>
            Print Sanction Letter
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wide text-slate-900 uppercase">
              EZIMICRO FINANCIAL SERVICES LTD
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              CIN: U65999MH2026PTC109876 • RBI Reg. No: B-13.02045
              <br />
              Kharagpur Branch #015 (Main Road, Kharagpur)
            </p>
          </div>
          <div className="text-left sm:text-right">
            <Badge tone="success">Sanction Approval</Badge>
            <p className="mt-2 text-xs text-slate-500">
              SL-2026-{app.appNumber.slice(-5)}
              <br />
              Date: Aug 10, 2026
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">To (Borrower):</p>
            <p className="mt-1 font-semibold text-slate-900">{app.borrower}</p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              House #120, Ward 1, Panchayat Ward 1, Kharagpur - 700015
              <br />
              Mobile: +91 98540 13720
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Affiliated Group:</p>
            <p className="mt-1 font-semibold text-blue-600">
              Swanirbhar Mahila JLG #005
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Masked Aadhaar: XXXX-XXXX-9760
              <br />
              PAN: BQFPK1120W
            </p>
          </div>
        </div>

        <section>
          <ModalSectionTitle
            icon={<ListChecks className="h-3.5 w-3.5 text-slate-600" />}
          >
            Key Fact Statement (KFS) & Sanction Terms
          </ModalSectionTitle>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full">
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.label}
                    className={
                      row.tone === "highlight"
                        ? "bg-emerald-50"
                        : "odd:bg-white even:bg-slate-50/80"
                    }
                  >
                    <td
                      className={`px-3.5 py-2.5 text-sm ${
                        row.tone === "highlight"
                          ? "font-semibold text-emerald-800"
                          : "text-slate-600"
                      }`}
                    >
                      {row.label}
                    </td>
                    <td
                      className={`px-3.5 py-2.5 text-right text-sm font-semibold ${
                        row.tone === "blue"
                          ? "text-blue-600"
                          : row.tone === "green"
                            ? "text-emerald-600"
                            : row.tone === "red"
                              ? "text-rose-600"
                              : row.tone === "highlight"
                                ? "text-emerald-800"
                                : "text-slate-900"
                      }`}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-8 pt-2 sm:grid-cols-2">
          <div className="text-center">
            <div className="mx-auto mb-2 h-px w-40 bg-slate-300" />
            <p className="text-xs font-semibold text-slate-700">
              Borrower Signature / Thumb
            </p>
            <p className="text-[11px] text-slate-400">({app.borrower})</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 h-px w-48 bg-slate-300" />
            <p className="text-xs font-semibold text-slate-700">
              Credit Sanction Committee Officer
            </p>
            <p className="text-[11px] text-slate-400">
              For eZiMicro Financial Services Ltd
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Bulk NEFT Disbursal ──────────────────────────────────────────── */

type BulkNeftModalProps = {
  open: boolean;
  onClose: () => void;
  apps: LosLoanApp[];
};

export function BulkNeftModal({ open, onClose, apps }: BulkNeftModalProps) {
  const batch = apps.slice(0, 5);
  const totalNet = batch.reduce((sum, row) => sum + row.netDisbursal, 0);
  const totalGross = batch.reduce((sum, row) => sum + row.applied, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Bulk Kendra Sanction & NEFT Disbursal Batch Export"
      subtitle="1-Click bulk approval and RBI/NPCI-compliant CSV batch generation for direct bank transfer."
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="space-y-5">
        <ModalBanner className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-400 uppercase">
              Kendra Cluster Batch: KND-0104
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              {batch.length} Applications Batched for Disbursal
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Total Disbursal Value:{" "}
              <span className="font-semibold text-emerald-400">
                {formatInr(totalNet)}
              </span>{" "}
              (Gross Principal: {formatInr(totalGross)})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={FileSpreadsheet}>
              Download NEFT CSV
            </Button>
            <Button variant="success" icon={Zap}>
              1-Click Bulk Sanction
            </Button>
          </div>
        </ModalBanner>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className={tableHead}>
                <th className="px-3 py-2.5">App #</th>
                <th className="px-3 py-2.5">Borrower Name</th>
                <th className="px-3 py-2.5">Bank Account</th>
                <th className="px-3 py-2.5">IFSC</th>
                <th className="px-3 py-2.5 text-right">Net Disbursal (₹)</th>
                <th className="px-3 py-2.5">Batch Status</th>
              </tr>
            </thead>
            <tbody>
              {batch.map((row, index) => (
                <tr key={row.appNumber}>
                  <td className={`${tableCell} font-semibold text-slate-900`}>
                    {row.appNumber}
                  </td>
                  <td className={`${tableCell} font-semibold text-slate-900`}>
                    {row.borrower}
                  </td>
                  <td className={`${tableCell} text-slate-500`}>
                    XXXX{4520 + index}
                  </td>
                  <td className={`${tableCell} text-slate-500`}>SBIN0004412</td>
                  <td className={`${tableCell} text-right font-semibold text-emerald-600`}>
                    {formatInr(row.netDisbursal)}
                  </td>
                  <td className={tableCell}>
                    <Badge tone="warning">READY_TO_DISBURSE</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Guarantee Matrix ─────────────────────────────────────────────── */

type GuaranteeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function GuaranteeMatrixModal({ open, onClose }: GuaranteeModalProps) {
  const members = [
    {
      id: "MEM-01",
      name: "Ruma Banerjee",
      role: "Group Leader",
      roleTone: "success" as const,
      pledge: "Guarantees all 4 peer members",
    },
    {
      id: "MEM-02",
      name: "Gita Saha",
      role: "Cashier / Deputy",
      roleTone: "neutral" as const,
      pledge: "Guarantees all 4 peer members",
    },
    {
      id: "MEM-03",
      name: "Anjali Chakraborty",
      role: "Member",
      roleTone: "neutral" as const,
      pledge: "Guarantees all 4 peer members",
    },
    {
      id: "MEM-04",
      name: "Aparna Sen",
      role: "Member",
      roleTone: "neutral" as const,
      pledge: "Guarantees all 4 peer members",
    },
    {
      id: "MEM-05",
      name: "Mousumi Ghosh",
      role: "Member",
      roleTone: "neutral" as const,
      pledge: "Guarantees all 4 peer members",
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Joint Liability Group (JLG) Mutual Guarantee Matrix"
      subtitle="5-Member cross-guarantee pledge with individual peer liability tracking under RBI guidelines"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="space-y-5">
        <div className="flex gap-3 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3.5">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
          <div>
            <p className="text-sm font-semibold text-violet-800">
              Joint Liability Peer Enforcement Protocol
            </p>
            <p className="mt-0.5 text-sm text-violet-700/90">
              Each member legally pledges mutual guarantee for all other 4 peer
              members&apos; loan installments.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className={tableHead}>
                <th className="px-3 py-2.5">Member ID</th>
                <th className="px-3 py-2.5">Borrower Name</th>
                <th className="px-3 py-2.5">JLG Group Role</th>
                <th className="px-3 py-2.5">Cross-Guarantee Pledge</th>
                <th className="px-3 py-2.5">Pledge Signed</th>
              </tr>
            </thead>
            <tbody>
              {members.map((row) => (
                <tr key={row.id}>
                  <td className={`${tableCell} font-semibold text-slate-900`}>
                    {row.id}
                  </td>
                  <td className={`${tableCell} font-semibold text-slate-900`}>
                    {row.name}
                  </td>
                  <td className={tableCell}>
                    <Badge tone={row.roleTone} caps={false}>
                      {row.role}
                    </Badge>
                  </td>
                  <td className={`${tableCell} text-slate-500`}>{row.pledge}</td>
                  <td className={tableCell}>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      E-Signed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

/* ─── JLG Group Loan Application ───────────────────────────────────── */

type JlgModalProps = {
  open: boolean;
  onClose: () => void;
};

const jlgMembers = [
  {
    id: "CUST-2026-0001",
    name: "Ruma Banerjee",
    amount: 75000,
    purpose: "Agriculture / Micro Enterprise Expansion",
  },
  {
    id: "CUST-2026-0002",
    name: "Gita Saha",
    amount: 75000,
    purpose: "Dairy livestock purchase",
  },
  {
    id: "CUST-2026-0003",
    name: "Anjali Chakraborty",
    amount: 50000,
    purpose: "Kirana shop working capital",
  },
  {
    id: "CUST-2026-0004",
    name: "Aparna Sen",
    amount: 45000,
    purpose: "Handloom inventory purchase",
  },
];

export function JlgGroupLoanModal({ open, onClose }: JlgModalProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    "CUST-2026-0001": true,
    "CUST-2026-0002": true,
  });
  const [amounts, setAmounts] = useState<Record<string, number>>(
    Object.fromEntries(jlgMembers.map((m) => [m.id, m.amount])),
  );

  const selectedRows = useMemo(
    () => jlgMembers.filter((m) => selected[m.id]),
    [selected],
  );
  const total = selectedRows.reduce(
    (sum, row) => sum + (amounts[row.id] ?? 0),
    0,
  );

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Originate Joint Liability Group (JLG) Bulk Loan Application"
      subtitle="Select kendra, JLG group, and product scheme under RBI microfinance guidelines"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Check} onClick={onClose}>
            Submit Group Loan Application
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-3">
          <FormField label="Select Kendra Centre">
            <select className={modalSelectClass} defaultValue="Kharagpur #015">
              <option>Kharagpur #015</option>
              <option>Sonarpur #022</option>
              <option>Barasat #031</option>
            </select>
          </FormField>
          <FormField label="Joint Liability Group (JLG)" required>
            <select
              className={modalSelectClass}
              defaultValue="Swanirbhar Mahila JLG #005"
            >
              <option>Swanirbhar Mahila JLG #005</option>
              <option>Udyog Mahila JLG #012</option>
            </select>
          </FormField>
          <FormField label="Loan Product Scheme" required>
            <select
              className={modalSelectClass}
              defaultValue="Mahila Krishi & Dairy Loan"
            >
              <option>Mahila Krishi & Dairy Loan</option>
              <option>Gramin Micro Enterprise Loan</option>
            </select>
          </FormField>
        </div>

        <section>
          <ModalSectionTitle
            icon={<Users className="h-3.5 w-3.5 text-slate-600" />}
            trailing={
              <span className="text-[10px] font-semibold tracking-[0.1em] text-slate-400 uppercase">
                Mutual Guarantee Active Across Selected Members
              </span>
            }
          >
            Group Member Loan Sanction Roster
          </ModalSectionTitle>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className={tableHead}>
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-3 py-2.5">Member Name & ID</th>
                  <th className="px-3 py-2.5">Requested Amount (₹)</th>
                  <th className="px-3 py-2.5">Loan Purpose</th>
                </tr>
              </thead>
              <tbody>
                {jlgMembers.map((row) => (
                  <tr key={row.id}>
                    <td className={tableCell}>
                      <input
                        type="checkbox"
                        checked={Boolean(selected[row.id])}
                        onChange={() => toggle(row.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                      />
                    </td>
                    <td className={tableCell}>
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-400">{row.id}</p>
                    </td>
                    <td className={tableCell}>
                      <input
                        type="number"
                        value={amounts[row.id] ?? 0}
                        onChange={(event) =>
                          setAmounts((prev) => ({
                            ...prev,
                            [row.id]: Number(event.target.value),
                          }))
                        }
                        className={`${modalFieldClass} max-w-[160px]`}
                      />
                    </td>
                    <td className={tableCell}>
                      <input
                        type="text"
                        defaultValue={row.purpose}
                        className={modalFieldClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ModalBanner className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">Group Disbursal Summary</p>
            <p className="mt-0.5 text-base font-semibold text-white">
              {selectedRows.length} Members Selected
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-slate-400">Total Group Sanction Amount</p>
            <p className="mt-0.5 text-xl font-bold text-emerald-400">
              {formatInr(total, 2)}
            </p>
          </div>
        </ModalBanner>
      </div>
    </Modal>
  );
}

/* ─── Individual Loan Application ──────────────────────────────────── */

type IndividualModalProps = {
  open: boolean;
  onClose: () => void;
};

export function IndividualLoanModal({ open, onClose }: IndividualModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Create Individual Loan Application"
      subtitle="Select borrower, loan product, applied principal amount, and tenure"
      footer={
        <>
          <Button variant="soft" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Send} onClick={onClose}>
            Submit Application
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Select Borrower">
          <select
            className={modalSelectClass}
            defaultValue="Anjali Chakraborty (CUST-2026-0119)"
          >
            <option>Anjali Chakraborty (CUST-2026-0119)</option>
            <option>Gita Saha (CUST-2026-0120)</option>
            <option>Aparna Sen (CUST-2026-0118)</option>
          </select>
        </FormField>

        <FormField label="Loan Product">
          <select
            className={modalSelectClass}
            defaultValue="Mahila Krishi & Dairy Loan (21.5% p.a. ReducingBalanceEmi)"
          >
            <option>
              Mahila Krishi & Dairy Loan (21.5% p.a. ReducingBalanceEmi)
            </option>
            <option>
              Gramin Micro Enterprise Loan (22% p.a. ReducingBalanceEmi)
            </option>
          </select>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Applied Amount (₹)">
            <input
              type="number"
              defaultValue={40000}
              className={modalFieldClass}
            />
          </FormField>
          <FormField label="Tenure (Months)">
            <input type="number" defaultValue={12} className={modalFieldClass} />
          </FormField>
        </div>

        <FormField label="Purpose of Loan">
          <input
            type="text"
            defaultValue="Dairy livestock purchase"
            className={modalFieldClass}
          />
        </FormField>
      </div>
    </Modal>
  );
}
