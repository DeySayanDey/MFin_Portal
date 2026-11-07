"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Clock,
  Eye,
  FileCheck2,
  Plus,
  RotateCw,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { loanModulePage } from "@/features/loan/loan-screen.data";
import {
  fetchDisbursements,
  isDisbursementClientError,
} from "../services/disbursement-client";
import {
  emptyLmsDisbursementFilters,
  LmsDisbursementFilters,
  type LmsDisbursementFilterValues,
} from "./LmsDisbursementFilters";
import { LmsDisbursementModal } from "./LmsDisbursementModal";
import { LmsDisbursementApproveModal } from "./LmsDisbursementApproveModal";
import { LmsDisbursementDetailModal } from "./LmsDisbursementDetailModal";
import type {
  LoanDisbursementAddResult,
  LoanDisbursementRow,
} from "../types/disbursement.types";

function approvalTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (s === "approved") return "success";
  if (s === "pending") return "warning";
  if (s === "rejected") return "danger";
  return "neutral";
}

function modeTone(modeCd: number): BadgeTone {
  if (modeCd === 1) return "neutral";
  if (modeCd === 2) return "info";
  if (modeCd === 3) return "violet";
  if (modeCd === 4) return "success";
  return "neutral";
}

type LmsDisbursementViewProps = {
  isHead?: boolean;
  branchId?: number | null;
  branchName?: string;
};

export function LmsDisbursementView({
  isHead = false,
  branchId = null,
  branchName = "",
}: LmsDisbursementViewProps) {
  const t = useTranslations("loanModule.screens.disbursement");
  const tModule = useTranslations("loanModule");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [rows, setRows] = useState<LoanDisbursementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<LmsDisbursementFilterValues>(
    emptyLmsDisbursementFilters,
  );
  const [applied, setApplied] = useState<LmsDisbursementFilterValues>(
    emptyLmsDisbursementFilters,
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] =
    useState<LoanDisbursementRow | null>(null);

  const [toastMessage, setToastMessage] = useToastText();

  const pageMeta = useMemo(
    () => loanModulePage("/lms/disbursement", "loanModule.screens.disbursement"),
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

      const res = await fetchDisbursements({
        page,
        per_page: pageSize,
        approval: applied.approval || undefined,
        branch_id: resolvedBranchId,
        payment_mode_cd: applied.paymentModeCd
          ? Number(applied.paymentModeCd)
          : undefined,
        is_final:
          applied.tranche === "final"
            ? true
            : applied.tranche === "draft"
              ? false
              : undefined,
        from_date: applied.fromDate || undefined,
        to_date: applied.toDate || undefined,
        keyword: applied.search || undefined,
      });

      const items = Array.isArray(res?.items) ? res.items : [];
      setRows(items);
      setTotal(res?.total ?? items.length);
    } catch (err: unknown) {
      setLoadError(
        isDisbursementClientError(err)
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

  const metrics = useMemo(() => {
    const totalGross = rows.reduce((acc, r) => acc + (r.gross_amount || 0), 0);
    const totalNet = rows.reduce((acc, r) => acc + (r.net_amount || 0), 0);
    const pendingCount = rows.filter(
      (r) => r.approval_status?.toLowerCase() === "pending",
    ).length;
    const finalCount = rows.filter((r) => r.is_final).length;
    return { totalGross, totalNet, pendingCount, finalCount };
  }, [rows]);

  const columns = useMemo<DataTableColumn<LoanDisbursementRow>[]>(
    () => [
      {
        id: "disbursement_no",
        header: t("columns.disbursementNo"),
        cell: (row) => (
          <div>
            <span className="block font-mono font-bold text-slate-900">
              {row.disbursement_no}
            </span>
            <span className="text-[11px] text-slate-400">
              {row.disbursement_date}
            </span>
          </div>
        ),
      },
      {
        id: "loan_account",
        header: t("columns.loanAccount"),
        cell: (row) => (
          <div>
            <span className="block font-mono font-semibold text-slate-800">
              {row.loan_account_no}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {row.application_no}
            </span>
          </div>
        ),
      },
      {
        id: "borrower",
        header: t("columns.borrower"),
        cell: (row) => (
          <div>
            <span className="block font-semibold text-slate-900">
              {row.member_name}
            </span>
            <span className="text-[11px] text-slate-500">{row.branch_name}</span>
          </div>
        ),
      },
      {
        id: "gross",
        header: t("columns.gross"),
        align: "end",
        cell: (row) => (
          <span className="block text-right font-bold text-slate-900">
            {money(row.gross_amount)}
          </span>
        ),
      },
      {
        id: "deductions",
        header: t("columns.deductions"),
        align: "end",
        cell: (row) => {
          const totalDeductions =
            (row.charge_deduction || 0) + (row.other_deduction || 0);
          return (
            <span className="block text-right font-semibold text-rose-700">
              {totalDeductions > 0 ? `-${money(totalDeductions)}` : money(0)}
            </span>
          );
        },
      },
      {
        id: "net",
        header: t("columns.net"),
        align: "end",
        cell: (row) => (
          <div className="text-right">
            <span className="block font-black text-teal-800">
              {money(row.net_amount)}
            </span>
            <Badge tone={modeTone(row.payment_mode_cd)}>
              {row.payment_mode}
            </Badge>
          </div>
        ),
      },
      {
        id: "tranche",
        header: t("columns.tranche"),
        cell: (row) => (
          <Badge tone={row.is_final ? "success" : "neutral"} caps>
            {row.is_final ? t("tranche.final") : t("tranche.draft")}
          </Badge>
        ),
      },
      {
        id: "status",
        header: t("columns.status"),
        cell: (row) => (
          <div>
            <Badge tone={approvalTone(row.approval_status)} caps>
              {row.approval_status}
            </Badge>
            {row.voucher_no ? (
              <span className="mt-0.5 block font-mono text-[11px] text-slate-500">
                {row.voucher_no}
              </span>
            ) : null}
          </div>
        ),
      },
    ],
    [format, t],
  );

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={toastMessage} />

      <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <Banknote className="h-3.5 w-3.5 text-teal-600" />
            {t("metrics.totalGross")}
          </span>
          <p className="mt-1 text-xl font-black text-slate-900">
            {money(metrics.totalGross)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <Wallet className="h-3.5 w-3.5 text-emerald-600" />
            {t("metrics.netPaid")}
          </span>
          <p className="mt-1 text-xl font-black text-emerald-700">
            {money(metrics.totalNet)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            {t("metrics.pending")}
          </span>
          <p className="mt-1 text-xl font-black text-amber-600">
            {metrics.pendingCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <FileCheck2 className="h-3.5 w-3.5 text-indigo-600" />
            {t("metrics.finalSettled")}
          </span>
          <p className="mt-1 text-xl font-black text-indigo-700">
            {metrics.finalCount}
          </p>
        </div>
      </div>

      <LmsDisbursementFilters
        values={filters}
        isHead={isHead}
        branchName={branchName}
        onChange={setFilters}
        onReset={() => {
          setFilters(emptyLmsDisbursementFilters);
          setApplied(emptyLmsDisbursementFilters);
          setPage(1);
        }}
      />

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
              onClick={() => setAddModalOpen(true)}
            >
              {t("disburse")}
            </Button>
          </div>
        }
        data={rows}
        columns={columns}
        getRowKey={(row) => String(row.disbursement_id)}
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
          render: (row) => {
            const isPending =
              row.approval_status?.toLowerCase() === "pending";
            return (
              <div className="inline-flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={Eye}
                  tooltip={t("actions.viewTooltip")}
                  onClick={() => {
                    setSelectedDisbursement(row);
                    setDetailModalOpen(true);
                  }}
                >
                  {t("actions.view")}
                </Button>
                {isPending ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    icon={ShieldAlert}
                    tooltip={t("actions.authorizeTooltip")}
                    onClick={() => {
                      setSelectedDisbursement(row);
                      setApproveModalOpen(true);
                    }}
                  >
                    {t("actions.authorize")}
                  </Button>
                ) : null}
              </div>
            );
          },
        }}
      />

      <LmsDisbursementModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={(res: LoanDisbursementAddResult) => {
          void load();
          setToastMessage(
            res.approval_status?.toLowerCase() === "pending"
              ? t("toast.pendingApproval")
              : t("toast.settled", { number: res.disbursement_no }),
          );
        }}
      />

      <LmsDisbursementDetailModal
        disbursement={selectedDisbursement}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onAuthorize={(row) => {
          setSelectedDisbursement(row);
          setApproveModalOpen(true);
        }}
      />

      <LmsDisbursementApproveModal
        disbursement={selectedDisbursement}
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onSuccess={() => {
          void load();
          setToastMessage(t("toast.decisionUpdated"));
        }}
      />
    </ModulePageShell>
  );
}
