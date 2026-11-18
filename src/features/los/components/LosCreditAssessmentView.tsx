"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Gauge, RotateCw, Scale, XCircle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { loanModulePage } from "@/features/loan/loan-screen.data";
import { fetchLoanApplications, fetchLoanEligibility, isLosClientError } from "../services/los-client";
import type {
  LoanApplicationRow,
  LoanEligibilityResult,
} from "../types/los.types";

export function LosCreditAssessmentView() {
  const t = useTranslations("loanModule.screens.creditAssessment");
  const tModule = useTranslations("loanModule");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [rows, setRows] = useState<LoanApplicationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Credit Assessment Modal
  const [assessingApp, setAssessingApp] = useState<LoanApplicationRow | null>(null);
  const [eligibility, setEligibility] = useState<LoanEligibilityResult | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  const pageMeta = useMemo(
    () => loanModulePage("/los/credit-assessment", "loanModule.screens.creditAssessment"),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // In text: Credit Assessment list -> ?stage=assessment
      const result = await fetchLoanApplications({
        page,
        per_page: pageSize,
        keyword: appliedSearch || undefined,
        stage: "assessment",
      });
      const items = Array.isArray(result?.items) ? result.items : [];
      setRows(items);
      setTotal(result?.meta?.total ?? items.length);
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
  }, [appliedSearch, page, pageSize, tModule]);

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

  const handleOpenAssessment = async (app: LoanApplicationRow) => {
    setAssessingApp(app);
    setLoadingAssessment(true);
    setAssessmentError(null);
    try {
      const res = await fetchLoanEligibility(app.application_id);
      setEligibility(res);
    } catch (err: unknown) {
      setAssessmentError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to evaluate credit rules",
      );
    } finally {
      setLoadingAssessment(false);
    }
  };

  const columns = useMemo<DataTableColumn<LoanApplicationRow>[]>(
    () => [
      {
        id: "application_no",
        header: t("columns.appNo"),
        cell: (row) => (
          <span className="font-bold text-slate-900 block">{row.application_no}</span>
        ),
      },
      {
        id: "borrower",
        header: t("columns.borrower"),
        cell: (row) => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.member_name}</span>
            <span className="text-[11px] text-slate-500">{row.member_ref_code} · {row.cust_type}</span>
          </div>
        ),
      },
      {
        id: "scheme",
        header: "Scheme",
        cell: (row) => (
          <div>
            <span className="font-medium text-slate-800 block">{row.scheme_name}</span>
            <span className="text-[11px] text-slate-500">{row.branch_name}</span>
          </div>
        ),
      },
      {
        id: "appl_amount",
        header: t("columns.requested"),
        align: "end",
        cell: (row) => (
          <div className="text-right">
            <span className="font-bold text-slate-900 block">{money(row.appl_amount)}</span>
            <span className="text-[11px] text-slate-500">{row.appl_tenure} Mo</span>
          </div>
        ),
      },
      {
        id: "purpose",
        header: t("columns.purpose"),
        cell: (row) => (
          <span className="text-slate-700">{row.purpose || "General Micro Loan"}</span>
        ),
      },
      {
        id: "status",
        header: t("columns.recommendation"),
        cell: (row) => (
          <Badge tone="warning" caps>
            {row.stage}
          </Badge>
        ),
      },
    ],
    [format, t],
  );

  return (
    <ModulePageShell page={pageMeta}>
      <FilterPanel
        onReset={() => {
          setSearch("");
          setAppliedSearch("");
          setPage(1);
        }}
      >
        <div className="min-w-[12rem] sm:max-w-[18rem]">
          <TextField
            label={tModule("search")}
            value={search}
            placeholder={tModule("searchPlaceholder")}
            onChange={setSearch}
          />
        </div>
      </FilterPanel>

      <DataTable
        title={t("title")}
        description={t("description")}
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
        getRowKey={(row) => String(row.application_id)}
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
              icon={Scale}
              onClick={() => handleOpenAssessment(row)}
            >
              Assess Eligibility
            </Button>
          ),
        }}
      />

      {/* CREDIT ASSESSMENT MODAL */}
      <Modal
        open={assessingApp != null}
        title={`Underwriting & Eligibility Assessment — ${assessingApp?.application_no}`}
        subtitle={`${assessingApp?.member_name} · Requested: ${money(assessingApp?.appl_amount)}`}
        size="xl"
        onClose={() => setAssessingApp(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAssessingApp(null)}>
              Close
            </Button>
          </div>
        }
      >
        {assessmentError && <Alert tone="error" className="mb-4">{assessmentError}</Alert>}

        {loadingAssessment ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          </div>
        ) : !eligibility ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Could not retrieve eligibility report.
          </div>
        ) : (
          <div className="space-y-6">
            {/* FOIR & Sizing KPI Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-medium uppercase tracking-wider">FOIR %</span>
                  <Gauge className="h-4 w-4" />
                </div>
                <p
                  className={`mt-1.5 text-2xl font-black ${
                    eligibility.foir_percent != null && eligibility.foir_percent > 50
                      ? "text-red-600"
                      : "text-teal-700"
                  }`}
                >
                  {eligibility.foir_percent != null
                    ? `${eligibility.foir_percent.toFixed(2)}%`
                    : "—"}
                </p>
                <span className="text-[10px] text-slate-400">Policy Benchmark: ≤ 50%</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Max Eligible Amount</span>
                <p className="mt-1.5 text-lg font-bold text-slate-900">{money(eligibility.max_eligible_amount)}</p>
                <span className="text-[10px] text-slate-400">At applied duration slab</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Proposed EMI</span>
                <p className="mt-1.5 text-lg font-bold text-slate-900">{money(eligibility.proposed_monthly_installment)}</p>
                <span className="text-[10px] text-slate-400">
                  At{" "}
                  {eligibility.interest_rate != null
                    ? `${eligibility.interest_rate}%`
                    : "—"}{" "}
                  rate
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Net Monthly Income</span>
                <p className="mt-1.5 text-lg font-bold text-slate-900">{money(eligibility.monthly_income)}</p>
                <span className="text-[10px] text-slate-400">Existing Oblig: {money(eligibility.existing_obligation)}</span>
              </div>
            </div>

            {/* Assessment Verdict Banner */}
            <div
              className={`flex items-center gap-3 rounded-xl border p-4 ${
                eligibility.all_mandatory_passed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              {eligibility.all_mandatory_passed ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 shrink-0 text-red-600" />
              )}
              <div className="flex-1">
                <h4 className="font-bold text-sm">
                  {eligibility.all_mandatory_passed
                    ? "Credit Gate: All Mandatory Eligibility Parameters PASSED"
                    : "Credit Gate: Mandatory Eligibility Criteria FAILED"}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {eligibility.all_mandatory_passed
                    ? "Application is eligible for field verification visit and committee appraisal."
                    : "Application does not satisfy minimum threshold requirements."}
                </p>
              </div>
            </div>

            {/* Checklist Parameters Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Applicant / Member</th>
                    <th className="p-3">Parameter Name</th>
                    <th className="p-3">Rule Definition</th>
                    <th className="p-3">Actual Value</th>
                    <th className="p-3 text-center">Severity</th>
                    <th className="p-3 text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eligibility.checks.map((chk, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">{chk.member_name}</td>
                      <td className="p-3 font-semibold text-slate-800">{chk.parameter_name}</td>
                      <td className="p-3 text-slate-600">{chk.rule}</td>
                      <td className="p-3 font-mono text-slate-900 font-semibold">{chk.actual_value}</td>
                      <td className="p-3 text-center">
                        <Badge tone={chk.is_mandatory ? "warning" : "neutral"}>
                          {chk.is_mandatory ? "Mandatory" : "Advisory"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {chk.passed === true ? (
                          <Badge tone="success">Passed</Badge>
                        ) : chk.passed === false ? (
                          <Badge tone="danger">Failed</Badge>
                        ) : (
                          <Badge tone="neutral">Not Evaluated</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </ModulePageShell>
  );
}
