"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Percent,
  RotateCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { loanModulePage } from "@/features/loan/loan-screen.data";
import {
  fetchLoanApprovals,
  fetchSanctionPreview,
  isLosClientError,
  submitLoanApproval,
} from "../services/los-client";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import type {
  LoanApprovalRow,
  LoanSanctionPreviewResult,
} from "../types/los.types";

function approvalTone(cd: number): BadgeTone {
  if (cd === 1) return "success"; // Approved
  if (cd === 2) return "danger"; // Rejected
  if (cd === 3) return "warning"; // Revision
  return "neutral";
}

export function LosApprovalView() {
  const t = useTranslations("loanModule.screens.approval");
  const tModule = useTranslations("loanModule");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [activeTab, setActiveTab] = useState<"pending" | "decided">("pending");
  const [rows, setRows] = useState<LoanApprovalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Committee Sanction & Decision Drawer/Modal
  const [sanctionModalOpen, setSanctionModalOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<LoanApprovalRow | null>(null);

  // Sanction parameters for KFS live preview
  const [sanctionedAmount, setSanctionedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("18");
  const [loanDuration, setLoanDuration] = useState("12");
  const [repayScheduleCd, setRepayScheduleCd] = useState("3"); // 3 Monthly
  const [moratoriumDays, setMoratoriumDays] = useState("0");
  const [firstDueDate, setFirstDueDate] = useState("");

  // Committee decision state
  const [decisionCd, setDecisionCd] = useState<1 | 2 | 3>(1);
  const [decisionRemarks, setDecisionRemarks] = useState("Approved by committee");

  // KFS preview data
  const [preview, setPreview] = useState<LoanSanctionPreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useToastText();
  const [toastMessage, setToastMessage] = useToastText();

  const pageMeta = useMemo(
    () => loanModulePage("/los/approval", "loanModule.screens.approval"),
    [],
  );

  useEffect(() => {
    fetchBranchList({ page: 1, perPage: 100, isActive: 1 })
      .then((res) => setBranchOptions(res.items.map((b) => ({ value: String(b.branchId), label: b.branchName }))))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchLoanApprovals({
        page,
        per_page: pageSize,
        pending_only: activeTab === "pending",
        branch_id: branchFilter ? Number(branchFilter) : undefined,
        keyword: appliedSearch || undefined,
      });
      const items = Array.isArray(result?.items) ? result.items : [];
      setRows(items);
      setTotal(result?.total ?? items.length);
    } catch (err: unknown) {
      setLoadError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : tModule("loadError"),
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, appliedSearch, branchFilter, page, pageSize, tModule]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setAppliedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (val: number | null | undefined) => {
    if (val == null) return "—";
    return format.number(val, { style: "currency", currency: "INR" });
  };

  const openDecisionModal = (row: LoanApprovalRow) => {
    setActiveApp(row);
    setSanctionedAmount(String(row.recommended_amount || row.application_amount || 38000));
    setInterestRate(String(row.interest_rate || "18"));
    setLoanDuration(String(row.appl_tenure || row.loan_duration || "12"));
    setRepayScheduleCd(String(row.repay_schedule_cd || "3"));
    setMoratoriumDays("0");
    setDecisionCd(1);
    setDecisionRemarks("Approved by credit committee");
    setDecisionError(null);
    setSanctionModalOpen(true);
  };

  // Run live Sanction Preview (Key Fact Statement)
  const triggerPreview = useCallback(async () => {
    if (!activeApp) return;
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const res = await fetchSanctionPreview({
        application_id: activeApp.loan_application_id,
        sanctioned_amount: sanctionedAmount ? Number(sanctionedAmount) : undefined,
        interest_rate: interestRate ? Number(interestRate) : undefined,
        loan_duration: loanDuration ? Number(loanDuration) : undefined,
        repay_schedule_cd: repayScheduleCd ? Number(repayScheduleCd) : undefined,
        moratorium_days: moratoriumDays ? Number(moratoriumDays) : undefined,
        first_due_date: firstDueDate || undefined,
      });
      setPreview(res);
    } catch (err: unknown) {
      setPreviewError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not generate KFS preview",
      );
    } finally {
      setLoadingPreview(false);
    }
  }, [activeApp, firstDueDate, interestRate, loanDuration, moratoriumDays, repayScheduleCd, sanctionedAmount]);

  useEffect(() => {
    if (sanctionModalOpen && activeApp) {
      const timer = setTimeout(() => {
        void triggerPreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [sanctionModalOpen, activeApp, triggerPreview]);

  const handleDecisionSubmit = async () => {
    if (!activeApp) return;
    setDecisionError(null);

    if ((decisionCd === 2 || decisionCd === 3) && !decisionRemarks.trim()) {
      setDecisionError("Remarks are mandatory when rejecting or recommending revision");
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await submitLoanApproval({
        loan_application_id: activeApp.loan_application_id,
        approval_status_cd: decisionCd,
        sanctioned_amount: decisionCd === 1 ? Number(sanctionedAmount) : undefined,
        interest_rate: decisionCd === 1 ? Number(interestRate) : undefined,
        loan_duration: decisionCd === 1 ? Number(loanDuration) : undefined,
        repay_schedule_cd: decisionCd === 1 ? Number(repayScheduleCd) : undefined,
        moratorium_days: decisionCd === 1 ? Number(moratoriumDays) : undefined,
        first_due_date: decisionCd === 1 && firstDueDate ? firstDueDate : undefined,
        remarks: decisionRemarks.trim() || undefined,
      });

      setSanctionModalOpen(false);
      setToastMessage(
        decisionCd === 1
          ? `Loan sanctioned! Account ${res.loan_account?.loan_account_no || ""} opened.`
          : "Decision saved successfully",
      );
      void load();
    } catch (err: unknown) {
      setDecisionError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to submit decision",
      );
    } finally {
      setSubmittingDecision(false);
    }
  };

  const columns = useMemo<DataTableColumn<LoanApprovalRow>[]>(
    () => [
      {
        id: "application_no",
        header: t("columns.appNo"),
        cell: (row) => (
          <div>
            <span className="font-bold text-slate-900 block">{row.application_no}</span>
            <span className="text-[11px] text-slate-400">{row.application_date}</span>
          </div>
        ),
      },
      {
        id: "borrower",
        header: t("columns.borrower"),
        cell: (row) => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.member_name}</span>
            <span className="text-[11px] text-slate-500">{row.scheme_name} · {row.branch_name}</span>
          </div>
        ),
      },
      {
        id: "application_amount",
        header: "Applied Amount",
        align: "end",
        cell: (row) => (
          <div className="text-right">
            <span className="font-bold text-slate-900 block">{money(row.application_amount)}</span>
            <span className="text-[11px] text-slate-500">{row.appl_tenure} Mo</span>
          </div>
        ),
      },
      {
        id: "recommended_amount",
        header: "FO Recommended",
        align: "end",
        cell: (row) => (
          <div className="text-right">
            <span className="font-bold text-indigo-700 block">{money(row.recommended_amount)}</span>
            <span className="text-[11px] text-slate-400">Field visit</span>
          </div>
        ),
      },
      {
        id: "sanctioned_amount",
        header: t("columns.sanctionAmount"),
        align: "end",
        cell: (row) => (
          <div className="text-right">
            <span className="font-bold text-teal-700 block">{money(row.sanctioned_amount)}</span>
            {row.interest_rate && (
              <span className="text-[11px] text-slate-500">{row.interest_rate}% · {row.loan_duration} Mo</span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: t("columns.status"),
        cell: (row) => (
          <div>
            {row.approval_status_cd ? (
              <Badge tone={approvalTone(row.approval_status_cd)} caps>
                {row.approval_status}
              </Badge>
            ) : (
              <Badge tone="warning">Pending Committee</Badge>
            )}
            {row.loan_account_no && (
              <span className="text-[11px] font-mono text-teal-800 block mt-0.5 font-bold">
                {row.loan_account_no}
              </span>
            )}
          </div>
        ),
      },
    ],
    [format],
  );

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={toastMessage} />

      {/* TOP TABS: WAITING FOR COMMITTEE VS DECIDED */}
      <div className="flex border-b border-slate-200 bg-white px-2 mb-2 rounded-t-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab("pending");
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === "pending"
              ? "border-teal-600 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Pending Committee Approval
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("decided");
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === "decided"
              ? "border-teal-600 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Sanctioned & Decided History
        </button>
      </div>

      <FilterPanel
        onReset={() => {
          setSearch("");
          setBranchFilter("");
          setAppliedSearch("");
          setPage(1);
        }}
      >
        <div className="min-w-[12rem] sm:max-w-[18rem]">
          <TextField
            label="Search Approvals"
            value={search}
            placeholder="Application no, borrower..."
            onChange={setSearch}
          />
        </div>
        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <SelectField
            label="Branch"
            value={branchFilter}
            options={branchOptions}
            placeholder="All Branches"
            onChange={setBranchFilter}
          />
        </div>
      </FilterPanel>

      <DataTable
        title={activeTab === "pending" ? "Applications Waiting for Committee" : "Loan Approval Decisions"}
        description="Review field verification findings, generate Key Fact Statement (KFS) previews, and sanction loan accounts"
        actions={
          <Button
            type="button"
            variant="secondary"
            icon={RotateCw}
            onClick={() => void load()}
          >
            {tCommon("retry")}
          </Button>
        }
        data={rows}
        columns={columns}
        getRowKey={(row) => String(row.loan_approval_id || row.loan_application_id)}
        loading={loading}
        error={loadError != null}
        errorMessage={loadError ?? undefined}
        onRetry={() => void load()}
        emptyTitle={tModule("emptyTitle")}
        emptyMessage={tModule("emptyMessage")}
        minWidth="840px"
        pagination={{
          page,
          pageSize,
          total,
          pageSizeOptions: [20, 50, 100],
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        rowActions={{
          header: tModule("actions"),
          render: (row) => (
            <Button
              type="button"
              size="sm"
              icon={Calculator}
              onClick={() => openDecisionModal(row)}
            >
              {row.approval_status_cd === 1 ? "View KFS" : "Sanction / Decide"}
            </Button>
          ),
        }}
      />

      {/* SANCTION PREVIEW & KEY FACT STATEMENT (KFS) DRAWER/MODAL */}
      <Modal
        open={sanctionModalOpen}
        title={`Sanction Appraisal & Key Fact Statement (KFS) — ${activeApp?.application_no}`}
        subtitle={`${activeApp?.member_name} · Scheme: ${activeApp?.scheme_name} · Recommended: ${money(activeApp?.recommended_amount)}`}
        size="xl"
        onClose={() => setSanctionModalOpen(false)}
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-slate-500">
              Approving automatically opens active Loan Account and generates repayment schedule.
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSanctionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={decisionCd === 1 ? "primary" : decisionCd === 2 ? "danger" : "secondary"}
                icon={decisionCd === 1 ? CheckCircle2 : decisionCd === 2 ? XCircle : RotateCw}
                onClick={handleDecisionSubmit}
                disabled={submittingDecision}
              >
                {submittingDecision
                  ? "Processing..."
                  : decisionCd === 1
                    ? "Approve & Sanction Loan"
                    : decisionCd === 2
                      ? "Reject Application"
                      : "Send for Revision"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <PageToast message={decisionError} tone="error" />

          {/* Interactive Sanction Parameters */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sanction Terms Configuration
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TextField
                label="Sanctioned Amount"
                value={sanctionedAmount}
                restrict="decimal"
                onChange={setSanctionedAmount}
              />
              <TextField
                label="Interest Rate (%)"
                value={interestRate}
                restrict="decimal"
                onChange={setInterestRate}
              />
              <TextField
                label="Duration (Months)"
                value={loanDuration}
                restrict="digits"
                onChange={setLoanDuration}
              />
              <SelectField
                label="Repay Schedule"
                value={repayScheduleCd}
                options={[
                  { value: "1", label: "1 Daily" },
                  { value: "2", label: "2 Weekly" },
                  { value: "3", label: "3 Monthly" },
                  { value: "4", label: "4 Balloon" },
                ]}
                onChange={setRepayScheduleCd}
              />
            </div>
          </div>

          {/* Key Fact Statement (KFS) Metrics Banner */}
          {loadingPreview ? (
            <div className="flex h-36 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 shadow-xs">
                  <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">Installment (EMI)</span>
                  <p className="mt-1 text-2xl font-black text-teal-900">{money(preview.installment_amount)}</p>
                  <span className="text-[10px] text-teal-700">{preview.loan_duration} Monthly Installments</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Interest</span>
                  <p className="mt-1 text-lg font-bold text-slate-900">{money(preview.total_interest)}</p>
                  <span className="text-[10px] text-slate-400">Total: {money(preview.total_repayable)}</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Net Disbursal</span>
                  <p className="mt-1 text-lg font-bold text-indigo-700">{money(preview.net_disbursal_amount)}</p>
                  <span className="text-[10px] text-slate-400">Deductions: {money(preview.total_deductions)}</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">APR Percentage</span>
                  <p className="mt-1 text-lg font-black text-slate-900">{preview.apr_percent.toFixed(2)}%</p>
                  <span className="text-[10px] text-slate-400">Annualised Effective Cost</span>
                </div>
              </div>

              {/* Upfront Deductions List */}
              {preview.upfront_deductions.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <h5 className="text-xs font-bold text-slate-700 mb-2">Upfront Scheme Charges & Deductions</h5>
                  <div className="divide-y divide-slate-100 text-xs">
                    {preview.upfront_deductions.map((d, i) => (
                      <div key={i} className="flex justify-between py-1.5">
                        <span className="text-slate-600">
                          {d.charge_name} <span className="text-[10px] text-slate-400">({d.deduct_during})</span>
                        </span>
                        <span className="font-semibold text-slate-900">{money(d.net_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repayment Schedule Preview (first 5 installments) */}
              {preview.schedule_preview.length > 0 && (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Generated Repayment Schedule Preview</span>
                    <span className="text-[11px] text-slate-500">First Due: {preview.first_due_date}</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-slate-500 text-[11px]">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Due Date</th>
                        <th className="p-2 text-right">Principal</th>
                        <th className="p-2 text-right">Interest</th>
                        <th className="p-2 text-right">Total Due</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.schedule_preview.slice(0, 6).map((s) => (
                        <tr key={s.installment_no}>
                          <td className="p-2 font-mono">{s.installment_no}</td>
                          <td className="p-2">{s.due_date}</td>
                          <td className="p-2 text-right">{money(s.principal_due)}</td>
                          <td className="p-2 text-right text-slate-500">{money(s.interest_due)}</td>
                          <td className="p-2 text-right font-semibold text-slate-900">{money(s.total_due)}</td>
                          <td className="p-2 text-right text-slate-600">{money(s.outs_principal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {/* Committee Decision Action Choice */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Committee Decision
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecisionCd(1)}
                className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                  decisionCd === 1
                    ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                1 Approved (Open Loan)
              </button>
              <button
                type="button"
                onClick={() => setDecisionCd(3)}
                className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                  decisionCd === 3
                    ? "border-amber-600 bg-amber-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                3 Revision (Resubmission)
              </button>
              <button
                type="button"
                onClick={() => setDecisionCd(2)}
                className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                  decisionCd === 2
                    ? "border-red-600 bg-red-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                2 Rejected
              </button>
            </div>
            <TextField
              label="Committee Remarks / Decision Notes"
              value={decisionRemarks}
              required={decisionCd !== 1}
              placeholder="Record approval reasoning or rejection grounds..."
              onChange={setDecisionRemarks}
            />
          </div>
        </div>
      </Modal>
    </ModulePageShell>
  );
}
