"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MapPin,
  Plus,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/Form";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { loanModulePage } from "@/features/loan/loan-screen.data";
import { fetchApplOptions } from "@/features/master/appl-options";
import { fetchStaffList } from "@/features/master/staff/services/staff-client";
import {
  fetchLoanInspections,
  isLosClientError,
  saveLoanInspection,
} from "../services/los-client";
import { OPT_INSPECTION_RESULT } from "../los-application.constants";
import type { LoanInspectionRow } from "../types/los.types";
import {
  emptyLosFieldVerificationFilters,
  LosFieldVerificationFilters,
  type LosFieldVerificationFilterValues,
} from "./LosFieldVerificationFilters";

function resultTone(cd: number | null | undefined): BadgeTone {
  if (cd === 1) return "success";
  if (cd === 2) return "danger";
  if (cd === 3) return "warning";
  return "neutral";
}

type LosFieldVerificationViewProps = {
  isHead?: boolean;
  branchId?: number | null;
  branchName?: string;
};

export function LosFieldVerificationView({
  isHead = false,
  branchId = null,
  branchName = "",
}: LosFieldVerificationViewProps) {
  const t = useTranslations("loanModule.screens.fieldVerification");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [rows, setRows] = useState<LoanInspectionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<LosFieldVerificationFilterValues>(
    emptyLosFieldVerificationFilters,
  );
  const [applied, setApplied] = useState<LosFieldVerificationFilterValues>(
    emptyLosFieldVerificationFilters,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [pendingApps, setPendingApps] = useState<LoanInspectionRow[]>([]);
  const [loadingPendingApps, setLoadingPendingApps] = useState(false);
  const [inspectAppId, setInspectAppId] = useState("");
  const [inspectionDate, setInspectionDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [foId, setFoId] = useState("");
  const [allVerified, setAllVerified] = useState(true);
  const [recommendedAmount, setRecommendedAmount] = useState("");
  const [inspectionResultCd, setInspectionResultCd] = useState("1");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoPath, setPhotoPath] = useState("");

  const [staffOptions, setStaffOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [resultOptions, setResultOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useToastText();
  const [toastMessage, setToastMessage] = useToastText();

  const pageMeta = useMemo(
    () =>
      loanModulePage(
        "/los/field-verification",
        "loanModule.screens.fieldVerification",
      ),
    [],
  );

  useEffect(() => {
    fetchStaffList({ page: 1, perPage: 200, status: 1 })
      .then((res) =>
        setStaffOptions(
          res.items.map((s) => ({
            value: String(s.staffId),
            label: s.employeeCode
              ? `${s.fullName} (${s.employeeCode})`
              : s.fullName,
          })),
        ),
      )
      .catch(() => setStaffOptions([]));

    fetchApplOptions(OPT_INSPECTION_RESULT)
      .then((opts) =>
        setResultOptions(
          opts.map((o) => ({
            value: String(o.optCode),
            label: o.optDescription,
          })),
        ),
      )
      .catch(() => setResultOptions([]));
  }, []);

  const money = useCallback(
    (val: number | null | undefined) => {
      if (val == null) return t("dash");
      return format.number(val, { style: "currency", currency: "INR" });
    },
    [format, t],
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

      const pendingOnly = applied.status === "pending";

      const [result, pendingSnap] = await Promise.all([
        fetchLoanInspections({
          page,
          per_page: pageSize,
          pending_only: pendingOnly || undefined,
          branch_id: resolvedBranchId,
          fo_id: applied.foId ? Number(applied.foId) : undefined,
          inspection_result_cd:
            !pendingOnly && applied.resultCd
              ? Number(applied.resultCd)
              : undefined,
          from_date: applied.fromDate || undefined,
          to_date: applied.toDate || undefined,
          keyword: applied.search || undefined,
        }),
        pendingOnly
          ? Promise.resolve(null)
          : fetchLoanInspections({
              page: 1,
              per_page: 1,
              pending_only: true,
              branch_id: resolvedBranchId,
            }).catch(() => null),
      ]);

      const items = Array.isArray(result?.items) ? result.items : [];
      setRows(items);
      setTotal(result?.total ?? items.length);
      if (pendingOnly) {
        setPendingTotal(result?.total ?? items.length);
      } else if (pendingSnap) {
        setPendingTotal(pendingSnap.total ?? 0);
      }
    } catch (err: unknown) {
      setLoadError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t("errors.loadFailed"),
      );
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [applied, branchId, isHead, page, pageSize, t]);

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

  const metrics = useMemo(() => {
    const positive = rows.filter((r) => r.inspection_result_cd === 1).length;
    const negative = rows.filter((r) => r.inspection_result_cd === 2).length;
    const reinspect = rows.filter(
      (r) => r.inspection_result_cd === 3 || !r.inspection_result_cd,
    ).length;
    return { positive, negative, reinspect };
  }, [rows]);

  const openAddModal = async (app?: LoanInspectionRow) => {
    setInspectAppId(app ? String(app.loan_application_id) : "");
    setInspectionDate(new Date().toISOString().slice(0, 10));
    setFoId(app?.fo_id ? String(app.fo_id) : "");
    setAllVerified(true);
    setRecommendedAmount(
      app?.recommended_amount != null
        ? String(app.recommended_amount)
        : app?.appl_amount != null
          ? String(app.appl_amount)
          : "",
    );
    setInspectionResultCd("1");
    setInspectionNotes("");
    setLatitude(app?.latitude != null ? String(app.latitude) : "");
    setLongitude(app?.longitude != null ? String(app.longitude) : "");
    setPhotoPath(app?.photo_path ?? "");
    setFormError(null);
    setInspectionModalOpen(true);

    if (!app) {
      setLoadingPendingApps(true);
      try {
        const resolvedBranchId = isHead
          ? applied.branchId
            ? Number(applied.branchId)
            : undefined
          : (branchId ?? undefined);
        const res = await fetchLoanInspections({
          page: 1,
          per_page: 100,
          pending_only: true,
          branch_id: resolvedBranchId,
        });
        setPendingApps(Array.isArray(res.items) ? res.items : []);
      } catch {
        setPendingApps([]);
      } finally {
        setLoadingPendingApps(false);
      }
    } else {
      setPendingApps([app]);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError(t("modal.geoUnsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        setFormError(
          t("modal.geoDenied", { message: err.message || t("dash") }),
        );
      },
    );
  };

  const handleSaveInspection = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError(null);

    const appId = Number(inspectAppId);
    if (!appId || appId <= 0) {
      setFormError(t("modal.errors.appRequired"));
      return;
    }
    if (!foId) {
      setFormError(t("modal.errors.foRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await saveLoanInspection({
        loan_application_id: appId,
        inspection_date: inspectionDate,
        fo_id: Number(foId),
        all_verified: allVerified,
        recommended_amount: recommendedAmount
          ? Number(recommendedAmount)
          : undefined,
        inspection_result_cd: Number(inspectionResultCd),
        inspection_notes: inspectionNotes || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        photo_path: photoPath || undefined,
      });

      setInspectionModalOpen(false);
      setToastMessage(t("toast.saved"));
      void load();
    } catch (err: unknown) {
      setFormError(
        isLosClientError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : t("modal.errors.saveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAppOptions = useMemo(
    () =>
      pendingApps.map((row) => ({
        value: String(row.loan_application_id),
        label: t("modal.appOption", {
          app: row.application_no || String(row.loan_application_id),
          borrower: row.member_name || t("dash"),
          amount: money(row.appl_amount),
        }),
      })),
    [money, pendingApps, t],
  );

  const columns = useMemo<DataTableColumn<LoanInspectionRow>[]>(
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
        id: "borrower",
        header: t("columns.borrower"),
        cell: (row) => (
          <div>
            <span className="block font-semibold text-slate-900">
              {row.member_name || t("dash")}
            </span>
            <span className="text-[11px] text-slate-500">
              {[row.scheme_name, row.branch_name].filter(Boolean).join(" · ") ||
                t("dash")}
            </span>
          </div>
        ),
      },
      {
        id: "appl_amount",
        header: t("columns.requested"),
        align: "end",
        cell: (row) => (
          <span className="block text-end font-bold text-slate-900">
            {money(row.appl_amount)}
          </span>
        ),
      },
      {
        id: "inspection_date",
        header: t("columns.inspectionDate"),
        cell: (row) => (
          <span className="text-slate-700">
            {row.inspection_date || t("dash")}
          </span>
        ),
      },
      {
        id: "fo_name",
        header: t("columns.officer"),
        cell: (row) => (
          <span className="font-medium text-slate-800">
            {row.fo_name || t("unassigned")}
          </span>
        ),
      },
      {
        id: "result",
        header: t("columns.result"),
        cell: (row) => (
          <div>
            {row.inspection_result_cd ? (
              <Badge tone={resultTone(row.inspection_result_cd)} caps>
                {row.inspection_result || t("resultFallback")}
              </Badge>
            ) : (
              <Badge tone="warning">{t("pendingBadge")}</Badge>
            )}
            {row.recommended_amount != null ? (
              <span className="mt-0.5 block text-[11px] font-semibold text-slate-700">
                {t("recommendedShort", {
                  amount: money(row.recommended_amount),
                })}
              </span>
            ) : null}
          </div>
        ),
      },
    ],
    [money, t],
  );

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={toastMessage} />

      <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
            {t("metrics.pending")}
          </span>
          <p className="mt-1 text-xl font-black text-amber-600">
            {pendingTotal}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {t("metrics.positive")}
          </span>
          <p className="mt-1 text-xl font-black text-emerald-700">
            {metrics.positive}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            {t("metrics.negative")}
          </span>
          <p className="mt-1 text-xl font-black text-rose-700">
            {metrics.negative}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
            {t("metrics.reinspect")}
          </span>
          <p className="mt-1 text-xl font-black text-indigo-700">
            {metrics.reinspect}
          </p>
        </div>
      </div>

      <LosFieldVerificationFilters
        values={filters}
        isHead={isHead}
        branchName={branchName}
        onChange={setFilters}
        onReset={() => {
          setFilters(emptyLosFieldVerificationFilters);
          setApplied(emptyLosFieldVerificationFilters);
          setPage(1);
        }}
      />

      <DataTable
        title={
          applied.status === "pending"
            ? t("table.pendingTitle")
            : t("table.historyTitle")
        }
        description={t("table.description")}
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={RotateCw}
              onClick={() => void load()}
            >
              {t("refresh")}
            </Button>
            <Button
              type="button"
              icon={Plus}
              onClick={() => void openAddModal()}
            >
              {t("recordVisit")}
            </Button>
          </div>
        }
        data={rows}
        columns={columns}
        getRowKey={(row) =>
          String(row.inspection_id ?? `app-${row.loan_application_id}`)
        }
        loading={loading}
        error={loadError != null}
        errorMessage={loadError ?? undefined}
        onRetry={() => void load()}
        emptyTitle={t("emptyTitle")}
        emptyMessage={
          applied.status === "pending"
            ? t("emptyPending")
            : t("emptyHistory")
        }
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
          header: t("columns.actions"),
          render: (row) => (
            <Button
              type="button"
              size="sm"
              icon={UserCheck}
              onClick={() => void openAddModal(row)}
            >
              {row.inspection_id ? t("actions.reInspect") : t("actions.inspect")}
            </Button>
          ),
        }}
      />

      <Modal
        open={inspectionModalOpen}
        title={t("modal.title")}
        subtitle={t("modal.subtitle")}
        size="lg"
        confirmOnSave={false}
        onClose={() => setInspectionModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setInspectionModalOpen(false)}
              disabled={submitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={() => void handleSaveInspection()}
              icon={ShieldCheck}
              loading={submitting}
              disabled={submitting}
            >
              {t("modal.submit")}
            </Button>
          </div>
        }
      >
        <form autoComplete="off" onSubmit={handleSaveInspection} className="space-y-4">
          <PageToast message={formError} tone="error" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label={t("modal.application")}
              value={inspectAppId}
              required
              options={[
                {
                  value: "",
                  label: loadingPendingApps
                    ? t("modal.loadingApps")
                    : t("modal.applicationPlaceholder"),
                },
                ...pendingAppOptions,
              ]}
              disabled={loadingPendingApps || pendingAppOptions.length === 0}
              onChange={(val) => {
                setInspectAppId(val);
                const selected = pendingApps.find(
                  (row) => String(row.loan_application_id) === val,
                );
                if (selected) {
                  if (selected.fo_id) setFoId(String(selected.fo_id));
                  if (selected.appl_amount != null) {
                    setRecommendedAmount(String(selected.appl_amount));
                  }
                }
              }}
            />
            <TextField
              label={t("modal.inspectionDate")}
              type="date"
              value={inspectionDate}
              required
              onChange={setInspectionDate}
            />
            <SelectField
              label={t("modal.officer")}
              value={foId}
              required
              options={[
                { value: "", label: t("modal.officerPlaceholder") },
                ...staffOptions,
              ]}
              onChange={setFoId}
            />
            <SelectField
              label={t("modal.result")}
              value={inspectionResultCd}
              required
              options={
                resultOptions.length > 0
                  ? resultOptions
                  : [
                      { value: "1", label: t("modal.results.positive") },
                      { value: "2", label: t("modal.results.negative") },
                      { value: "3", label: t("modal.results.reinspect") },
                    ]
              }
              onChange={setInspectionResultCd}
            />
            <TextField
              label={t("modal.recommendedAmount")}
              value={recommendedAmount}
              restrict="decimal"
              placeholder={t("modal.recommendedPlaceholder")}
              onChange={setRecommendedAmount}
            />
            <div className="flex items-center gap-2 pt-6">
              <input autoComplete="off"
                type="checkbox"
                id="all_verified"
                checked={allVerified}
                onChange={(e) => setAllVerified(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <label
                htmlFor="all_verified"
                className="text-xs font-semibold text-slate-800"
              >
                {t("modal.allVerified")}
              </label>
            </div>
          </div>

          {!loadingPendingApps && pendingAppOptions.length === 0 ? (
            <p className="text-xs font-medium text-amber-700">
              {t("modal.noPendingApps")}
            </p>
          ) : null}

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <MapPin className="h-4 w-4 text-teal-600" />
                {t("modal.gpsTitle")}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleGetCurrentLocation}
              >
                {t("modal.captureGps")}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label={t("modal.latitude")}
                value={latitude}
                placeholder={t("modal.latitudePlaceholder")}
                onChange={setLatitude}
              />
              <TextField
                label={t("modal.longitude")}
                value={longitude}
                placeholder={t("modal.longitudePlaceholder")}
                onChange={setLongitude}
              />
            </div>
          </div>

          <TextField
            label={t("modal.photoPath")}
            value={photoPath}
            placeholder={t("modal.photoPlaceholder")}
            onChange={setPhotoPath}
          />

          <TextField
            label={t("modal.notes")}
            value={inspectionNotes}
            placeholder={t("modal.notesPlaceholder")}
            onChange={setInspectionNotes}
          />
        </form>
      </Modal>
    </ModulePageShell>
  );
}
