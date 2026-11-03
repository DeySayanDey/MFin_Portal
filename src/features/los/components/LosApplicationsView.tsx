"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, History, Pencil, Plus, RotateCw, ShieldAlert, Sparkles } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { loanModulePage } from "@/features/loan/loan-screen.data";
import {
  APPL_STATUS_APPROVED,
  APPL_STATUS_REJECTED,
  APPL_STATUS_RESUBMISSION,
  APPL_STATUS_SUBMITTED,
  applStatusKey,
} from "../los-application.constants";
import { fetchLoanApplications, isLosClientError } from "../services/los-client";
import { LosApplicationDrawer } from "./LosApplicationDrawer";
import { LosApplicationFormModal } from "./LosApplicationFormModal";
import { LosApplicationStatusModal } from "./LosApplicationStatusModal";
import type {
  LoanApplicationRow,
  LoanApplicationSummary,
} from "../types/los.types";

type Filters = {
  search: string;
  stage: string;
  custTypeCd: string;
  schemeId: string;
};

const emptyFilters: Filters = { search: "", stage: "", custTypeCd: "", schemeId: "" };

function stageTone(stage: string): BadgeTone {
  if (stage === "disbursed") return "success";
  if (stage === "sanctioned") return "info";
  if (stage === "approval" || stage === "assessment") return "warning";
  if (stage === "field_verification") return "violet";
  if (stage === "rejected") return "danger";
  return "neutral";
}

function applStatusTone(code: number): BadgeTone {
  if (code === APPL_STATUS_APPROVED) return "success";
  if (code === APPL_STATUS_REJECTED) return "danger";
  if (code === APPL_STATUS_RESUBMISSION) return "warning";
  if (code === APPL_STATUS_SUBMITTED) return "info";
  return "neutral";
}

export function LosApplicationsView() {
  const t = useTranslations("los.applications");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [rows, setRows] = useState<LoanApplicationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<LoanApplicationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawers and Modals
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialTab, setDrawerInitialTab] = useState<"overview" | "timeline" | "eligibility">("overview");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<LoanApplicationRow | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusApp, setStatusApp] = useState<LoanApplicationRow | null>(null);

  const [successMessage, setSuccessMessage] = useToastText();
  const pageMeta = useMemo(
    () => loanModulePage("/los/applications", "los.applications"),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchLoanApplications({
        page,
        per_page: pageSize,
        keyword: applied.search || undefined,
        stage: applied.stage || undefined,
        cust_type_cd: applied.custTypeCd ? Number(applied.custTypeCd) : undefined,
        scheme_id: applied.schemeId ? Number(applied.schemeId) : undefined,
      });
      const items = Array.isArray(result?.items) ? result.items : [];
      setRows(items);
      setTotal(result?.meta?.total ?? items.length);
      if (result?.meta?.summary) {
        setSummary(result.meta.summary);
      }
    } catch (err: unknown) {
      setLoadError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t("loadError"),
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [applied, page, pageSize, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setApplied(filters);
    }, 350);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (val: number | null | undefined) => {
    if (val == null) return "—";
    return format.number(val, { style: "currency", currency: "INR" });
  };

  function openApplicationDrawer(
    row: LoanApplicationRow,
    initialTab: "overview" | "timeline" | "eligibility" = "overview",
  ) {
    setSelectedAppId(row.application_id);
    setDrawerInitialTab(initialTab);
    setDrawerOpen(true);
  }

  const columns = useMemo<DataTableColumn<LoanApplicationRow>[]>(
    () => [
      {
        id: "application_no",
        header: t("columns.appNumber"),
        headerClassName: "w-[11%] min-w-[150px]",
        className: "w-[11%] min-w-[150px]",
        cell: (row) => (
          <div>
            <span className="font-bold text-slate-900 block">{row.application_no}</span>
            <span className="text-[11px] text-slate-400">{row.application_date}</span>
          </div>
        ),
      },
      {
        id: "loan_account_no",
        header: t("columns.loanAccountNo"),
        headerClassName: "w-[15%] min-w-[180px]",
        className: "w-[15%] min-w-[180px]",
        cell: (row) =>
          row.loan_account_no ? (
            <span className="font-mono text-sm font-medium text-teal-800">
              {row.loan_account_no}
            </span>
          ) : (
            <span className="text-slate-400">{t("dash")}</span>
          ),
      },
      {
        id: "borrower",
        header: t("columns.borrower"),
        headerClassName: "w-[11%] min-w-[160px]",
        className: "w-[11%] min-w-[160px]",
        cell: (row) => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.member_name}</span>
            <span className="text-[11px] text-slate-500">
              {row.member_ref_code} · {row.cust_type}
            </span>
          </div>
        ),
      },
      {
        id: "scheme",
        header: t("columns.scheme"),
        headerClassName: "w-[11%] min-w-[170px]",
        className: "w-[11%] min-w-[170px]",
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
        headerClassName: "w-[13%] min-w-[150px]",
        className: "w-[13%] min-w-[150px]",
        align: "end",
        cell: (row) => (
          <div className="text-right">
            <span className="font-bold text-slate-900 block">{money(row.appl_amount)}</span>
            <span className="text-[11px] text-slate-500">{row.appl_tenure} Mo · {row.repay_duration}</span>
          </div>
        ),
      },
      {
        id: "sanctioned_amount",
        header: t("summary.sanctioned"),
        headerClassName: "w-[13%] min-w-[160px]",
        className: "w-[13%] min-w-[160px]",
        align: "end",
        cell: (row) => (
          <div className="text-right">
            <span className="font-bold text-teal-700 block">{money(row.sanctioned_amount)}</span>
          </div>
        ),
      },
      {
        id: "stage",
        header: t("columns.status"),
        headerClassName: "w-[12%] min-w-[150px]",
        className: "w-[12%] min-w-[150px]",
        cell: (row) => {
          const rawStage = row.stage?.trim().toLowerCase() ?? "";
          const statusKey = applStatusKey(row.appl_status_cd);
          const knownStages = [
            "draft",
            "assessment",
            "field_verification",
            "approval",
            "sanctioned",
            "disbursed",
            "rejected",
          ] as const;
          const stageKey = knownStages.includes(
            rawStage as (typeof knownStages)[number],
          )
            ? (rawStage as (typeof knownStages)[number])
            : null;
          const stageLabel = stageKey
            ? t(`statuses.${stageKey}`)
            : rawStage.replaceAll("_", " ");
          const statusLabel =
            stageLabel ||
            row.appl_status?.trim() ||
            (statusKey ? t(`applStatus.${statusKey}`) : t("dash"));
          const statusTone = stageKey
            ? stageTone(stageKey)
            : stageLabel
              ? "neutral"
              : applStatusTone(row.appl_status_cd);
          const isTerminal =
            stageKey === "disbursed" ||
            stageKey === "rejected" ||
            row.appl_status_cd === APPL_STATUS_REJECTED;

          return (
            <div className="flex flex-col items-start gap-1">
              <Badge tone={statusTone} className="max-w-full">
                {statusLabel}
              </Badge>
              {row.current_owner && !isTerminal ? (
                <span className="text-[11px] text-slate-500 block">
                  {t("owner", { name: row.current_owner })}
                </span>
              ) : null}
            </div>
          );
        },
      },
    ],
    [format, t],
  );

  const stageTabs = [
    { id: "", label: t("filters.all"), count: summary?.total_count },
    { id: "field_verification", label: t("statuses.field_verification"), count: summary?.field_verification_count },
    { id: "approval", label: t("statuses.approval"), count: summary?.approval_count },
    { id: "sanctioned", label: t("statuses.sanctioned"), count: summary?.sanctioned_count },
    { id: "disbursed", label: t("statuses.disbursed"), count: summary?.disbursed_count },
    { id: "rejected", label: t("statuses.rejected"), count: summary?.rejected_count },
  ];

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />

      {/* KPI METRIC CARDS HEADER */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 mb-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{t("summary.total")}</span>
            <p className="mt-1 text-xl font-black text-slate-900">{summary.total_count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{t("statuses.field_verification")}</span>
            <p className="mt-1 text-xl font-black text-violet-700">{summary.field_verification_count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{t("statuses.approval")}</span>
            <p className="mt-1 text-xl font-black text-amber-600">{summary.approval_count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{t("statuses.sanctioned")}</span>
            <p className="mt-1 text-xl font-black text-teal-700">{summary.sanctioned_count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{t("statuses.disbursed")}</span>
            <p className="mt-1 text-xl font-black text-emerald-700">{summary.disbursed_count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{t("summary.requested")}</span>
            <p className="mt-1 text-base font-bold text-slate-900">{money(summary.total_requested)}</p>
          </div>
        </div>
      )}

      {/* STAGE QUICK FILTER TABS */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-2 mb-2 rounded-t-xl">
        {stageTabs.map((st) => {
          const active = filters.stage === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, stage: st.id }))}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "border-teal-600 text-teal-800"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{st.label}</span>
              {st.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${active ? "bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-600"}`}>
                  {st.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <FilterPanel
        onReset={() => {
          setFilters(emptyFilters);
          setApplied(emptyFilters);
          setPage(1);
          setSuccessMessage(null);
        }}
      >
        <div className="min-w-[12rem] sm:max-w-[16rem]">
          <TextField
            label={t("filters.search")}
            value={filters.search}
            placeholder={t("filters.searchPlaceholder")}
            onChange={(val) => setFilters((c) => ({ ...c, search: val }))}
          />
        </div>
        <div className="min-w-[10rem] sm:max-w-[14rem]">
          <SelectField
            label="Customer Type"
            value={filters.custTypeCd}
            options={[
              { value: "", label: "All Borrower Types" },
              { value: "2", label: "Individual Loan" },
              { value: "1", label: "JLG / Group Loan" },
            ]}
            onChange={(val) => setFilters((c) => ({ ...c, custTypeCd: val }))}
          />
        </div>
      </FilterPanel>

      <DataTable
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={RotateCw}
              onClick={() => void load()}
            >
              {tCommon("retry")}
            </Button>
            <Button
              type="button"
              icon={Plus}
              onClick={() => {
                setEditingApp(null);
                setFormModalOpen(true);
              }}
            >
              {t("create")}
            </Button>
          </div>
        }
        data={rows}
        columns={columns}
        tableLayout="fixed"
        getRowKey={(row) => String(row.application_id)}
        loading={loading}
        error={loadError != null}
        errorMessage={loadError ?? undefined}
        onRetry={() => void load()}
        emptyTitle={t("emptyTitle")}
        emptyMessage={t("emptyMessage")}
        minWidth="1440px"
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
          header: t("columns.actions"),
          className: "w-[14%] min-w-[220px]",
          render: (row) => {
            const canEdit =
              (row.appl_status_cd === APPL_STATUS_SUBMITTED ||
                row.appl_status_cd === APPL_STATUS_RESUBMISSION) &&
              !row.loan_account_id;
            return (
              <div className="inline-flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Eye}
                  tooltip={t("actions.viewDetails")}
                  onClick={() => openApplicationDrawer(row)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={History}
                  tooltip={t("actions.viewTimeline")}
                  onClick={() => openApplicationDrawer(row, "timeline")}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Sparkles}
                  tooltip={t("actions.viewEligibility")}
                  onClick={() => openApplicationDrawer(row, "eligibility")}
                />
                {canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={Pencil}
                    tooltip={t("actions.edit")}
                    onClick={() => {
                      setEditingApp(row);
                      setFormModalOpen(true);
                    }}
                  />
                )}
                {row.appl_status_cd !== APPL_STATUS_APPROVED &&
                  row.appl_status_cd !== APPL_STATUS_REJECTED && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={ShieldAlert}
                    tooltip={t("actions.changeStatus")}
                    onClick={() => {
                      setStatusApp(row);
                      setStatusModalOpen(true);
                    }}
                  />
                )}
              </div>
            );
          },
        }}
      />

      {/* Full Record Drawer with Child Records & Timeline */}
      <LosApplicationDrawer
        applicationId={selectedAppId}
        open={drawerOpen}
        initialTab={drawerInitialTab}
        onClose={() => setDrawerOpen(false)}
        onApplicationUpdated={() => {
          void load();
          setSuccessMessage("Application updated");
        }}
      />

      {/* Create / Edit Modal */}
      <LosApplicationFormModal
        open={formModalOpen}
        editingApp={editingApp}
        onClose={() => setFormModalOpen(false)}
        onSuccess={() => {
          void load();
          setSuccessMessage(editingApp ? "Application updated successfully" : "Application created successfully");
        }}
      />

      {/* Status Modal */}
      <LosApplicationStatusModal
        application={statusApp}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSuccess={() => {
          void load();
          setSuccessMessage("Status updated successfully");
        }}
      />
    </ModulePageShell>
  );
}
