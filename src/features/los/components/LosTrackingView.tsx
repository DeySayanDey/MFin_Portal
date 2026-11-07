"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { loanModulePage } from "@/features/loan/loan-screen.data";
import {
  fetchLoanApplications,
  fetchLoanApplicationTimeline,
  isLosClientError,
} from "../services/los-client";
import {
  emptyLosApplicationFilters,
  LosApplicationsFilters,
  type LosApplicationFilterValues,
} from "./LosApplicationsFilters";
import type {
  LoanApplicationRow,
  LoanApplicationTimelineEvent,
} from "../types/los.types";

function stageTone(stage: string): BadgeTone {
  if (stage === "disbursed") return "success";
  if (stage === "sanctioned") return "info";
  if (stage === "approval" || stage === "assessment") return "warning";
  if (stage === "field_verification") return "violet";
  if (stage === "rejected") return "danger";
  return "neutral";
}

type LosTrackingViewProps = {
  isHead?: boolean;
  branchId?: number | null;
  branchName?: string;
};

export function LosTrackingView({
  isHead = false,
  branchId = null,
  branchName = "",
}: LosTrackingViewProps) {
  const t = useTranslations("loanModule.screens.tracking");
  const tApps = useTranslations("los.applications");
  const tModule = useTranslations("loanModule");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [rows, setRows] = useState<LoanApplicationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<LosApplicationFilterValues>(
    emptyLosApplicationFilters,
  );
  const [applied, setApplied] = useState<LosApplicationFilterValues>(
    emptyLosApplicationFilters,
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [trackingApp, setTrackingApp] = useState<LoanApplicationRow | null>(
    null,
  );
  const [timelineEvents, setTimelineEvents] = useState<
    LoanApplicationTimelineEvent[]
  >([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const pageMeta = useMemo(
    () => loanModulePage("/los/tracking", "loanModule.screens.tracking"),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const resolvedBranchId = isHead
        ? applied.branchId
          ? Number(applied.branchId)
          : undefined
        : (branchId ?? undefined);

      const result = await fetchLoanApplications({
        page,
        per_page: pageSize,
        keyword: applied.search || undefined,
        stage: applied.stage || undefined,
        cust_type_cd: applied.custTypeCd
          ? Number(applied.custTypeCd)
          : undefined,
        scheme_id: applied.schemeId ? Number(applied.schemeId) : undefined,
        branch_id: resolvedBranchId,
        from_date: applied.fromDate || undefined,
        to_date: applied.toDate || undefined,
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
  }, [applied, branchId, isHead, page, pageSize, tModule]);

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

  const handleOpenTimeline = async (app: LoanApplicationRow) => {
    setTrackingApp(app);
    setLoadingTimeline(true);
    try {
      const evts = await fetchLoanApplicationTimeline(app.application_id);
      setTimelineEvents(evts);
    } catch {
      setTimelineEvents([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const stageLabel = (stage: string) => {
    const raw = stage?.trim().toLowerCase() ?? "";
    const known = [
      "draft",
      "assessment",
      "field_verification",
      "approval",
      "sanctioned",
      "disbursed",
      "rejected",
    ] as const;
    if (known.includes(raw as (typeof known)[number])) {
      return tApps(`statuses.${raw as (typeof known)[number]}`);
    }
    return raw.replaceAll("_", " ") || tApps("dash");
  };

  const columns = useMemo<DataTableColumn<LoanApplicationRow>[]>(
    () => [
      {
        id: "application_no",
        header: t("columns.appNo"),
        cell: (row) => (
          <span className="block font-bold text-slate-900">
            {row.application_no}
          </span>
        ),
      },
      {
        id: "member_name",
        header: t("columns.customer"),
        cell: (row) => (
          <div>
            <span className="block font-semibold text-slate-900">
              {row.member_name}
            </span>
            <span className="text-[11px] text-slate-500">
              {row.member_ref_code}
            </span>
          </div>
        ),
      },
      {
        id: "branch_name",
        header: t("columns.branch"),
        cell: (row) => (
          <div>
            <span className="block font-medium text-slate-800">
              {row.branch_name}
            </span>
            <span className="text-[11px] text-slate-500">{row.scheme_name}</span>
          </div>
        ),
      },
      {
        id: "application_date",
        header: t("columns.date"),
        cell: (row) => (
          <span className="text-slate-700">{row.application_date}</span>
        ),
      },
      {
        id: "current_owner",
        header: t("columns.owner"),
        cell: (row) => (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
            <span className="font-medium text-slate-800">
              {row.current_owner}
            </span>
          </div>
        ),
      },
      {
        id: "stage",
        header: t("columns.status"),
        cell: (row) => (
          <Badge tone={stageTone(row.stage)} caps>
            {stageLabel(row.stage)}
          </Badge>
        ),
      },
    ],
    [t, tApps],
  );

  return (
    <ModulePageShell page={pageMeta}>
      <LosApplicationsFilters
        values={filters}
        isHead={isHead}
        branchName={branchName}
        onChange={setFilters}
        onReset={() => {
          setFilters(emptyLosApplicationFilters);
          setApplied(emptyLosApplicationFilters);
          setPage(1);
        }}
      />

      <DataTable
        title={t("title")}
        description={t("description")}
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
              variant="secondary"
              icon={History}
              tooltip={t("actions.timeline")}
              onClick={() => void handleOpenTimeline(row)}
            >
              {t("actions.timeline")}
            </Button>
          ),
        }}
      />

      <Modal
        open={trackingApp != null}
        title={t("timeline.title", {
          number: trackingApp?.application_no ?? "",
        })}
        subtitle={t("timeline.subtitle", {
          borrower: trackingApp?.member_name ?? "",
          owner: trackingApp?.current_owner ?? "",
        })}
        size="lg"
        onClose={() => setTrackingApp(null)}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setTrackingApp(null)}>
              {tCommon("close")}
            </Button>
          </div>
        }
      >
        {loadingTimeline ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          </div>
        ) : timelineEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            {t("timeline.empty")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative ml-4 space-y-6 border-l-2 border-teal-500/30 pl-6">
              {timelineEvents.map((evt) => (
                <div key={evt.seq} className="relative">
                  <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                    {evt.seq}
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {stageLabel(evt.stage)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {evt.date}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {t("timeline.actionBy", { name: evt.by })}
                    </p>
                    {evt.result ? (
                      <p className="mt-0.5 text-xs font-semibold text-teal-700">
                        {t("timeline.outcome", { result: evt.result })}
                      </p>
                    ) : null}
                    {evt.amount ? (
                      <p className="mt-0.5 text-xs text-slate-700">
                        {t("timeline.amount", { amount: money(evt.amount) })}
                      </p>
                    ) : null}
                    {evt.ref_no ? (
                      <p className="font-mono text-[11px] text-slate-500">
                        {t("timeline.ref", { ref: evt.ref_no })}
                      </p>
                    ) : null}
                    {evt.remarks ? (
                      <p className="mt-2 rounded border border-slate-100 bg-slate-50 p-2 text-xs italic text-slate-600">
                        &ldquo;{evt.remarks}&rdquo;
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </ModulePageShell>
  );
}
