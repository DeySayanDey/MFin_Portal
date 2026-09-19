"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil, Plus, Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { BranchForm } from "@/features/master/branch/components/BranchForm";
import {
  createBranch,
  fetchBranchList,
  isBranchClientError,
  updateBranch,
} from "@/features/master/branch/services/branch-client";
import type {
  Branch,
  BranchCreateInput,
  BranchUpdateInput,
  PaginationMeta,
} from "@/features/master/branch/types/branch.types";

const SEARCH_DEBOUNCE_MS = 350;

type KendraBranchMasterTabProps = {
  onBranchesChange?: (branches: Branch[]) => void;
};

export function KendraBranchMasterTab({
  onBranchesChange,
}: KendraBranchMasterTabProps) {
  const t = useTranslations("master.branch");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const onBranchesChangeRef = useRef(onBranchesChange);
  onBranchesChangeRef.current = onBranchesChange;

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<Branch[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (keyword === appliedKeyword) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedKeyword(keyword);
      setSuccessMessage(null);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [keyword, appliedKeyword]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchBranchList({
          page,
          perPage: pageSize,
          keyword: appliedKeyword.trim() || undefined,
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
        onBranchesChangeRef.current?.(result.items);
      } catch (err) {
        if (cancelled) return;
        if (isBranchClientError(err) && err.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setError(true);
        setErrorMessage(
          isBranchClientError(err) ? err.message : tErrors("generic"),
        );
        setItems([]);
        setMeta(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [appliedKeyword, page, pageSize, reloadKey, router, tErrors]);

  const total = meta?.total ?? items.length;
  const activeCount = items.filter((row) => row.isActive).length;
  const headCount = items.filter((row) => row.isHead).length;

  const columns = useMemo<DataTableColumn<Branch>[]>(
    () => [
      {
        id: "branchCode",
        header: t("columns.branchCode"),
        cell: (row) => (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-blue-700">
            {row.branchCode}
          </span>
        ),
      },
      {
        id: "branchName",
        header: t("columns.branchName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.branchName}</span>
        ),
      },
      {
        id: "branchMobile",
        header: t("columns.mobile"),
        cell: (row) => (
          <span className="text-slate-700">{row.branchMobile ?? ""}</span>
        ),
      },
      {
        id: "branchMail",
        header: t("columns.email"),
        cell: (row) => (
          <span className="text-slate-700">{row.branchMail ?? ""}</span>
        ),
      },
      {
        id: "isHead",
        header: t("columns.isHead"),
        cell: (row) => (
          <Badge tone={row.isHead ? "info" : "neutral"} caps>
            {row.isHead ? t("filters.isHeadYes") : t("filters.isHeadNo")}
          </Badge>
        ),
      },
      {
        id: "isActive",
        header: t("columns.status"),
        cell: (row) => (
          <Badge tone={row.isActive ? "success" : "neutral"} caps>
            {row.isActive ? t("statusActive") : t("statusInactive")}
          </Badge>
        ),
      },
    ],
    [t],
  );

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(branch: Branch) {
    setFormMode("edit");
    setEditing(branch);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleCreate(input: BranchCreateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await createBranch(input);
      setFormOpen(false);
      setSuccessMessage(t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isBranchClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setFormError(isBranchClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: BranchUpdateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await updateBranch(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(t("updateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isBranchClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setFormError(isBranchClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(branch: Branch) {
    const nextActive = !branch.isActive;
    setStatusBusyId(branch.branchId);
    setSuccessMessage(null);
    try {
      await updateBranch({
        branchId: branch.branchId,
        branchCode: branch.branchCode,
        branchName: branch.branchName,
        branchAddress: branch.branchAddress,
        branchMobile: branch.branchMobile,
        branchMail: branch.branchMail,
        headerText: branch.headerText,
        isHead: branch.isHead,
        isActive: nextActive,
      });
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isBranchClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setError(true);
      setErrorMessage(
        isBranchClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button type="button" icon={Plus} onClick={openCreate}>
          {t("add")}
        </Button>
      </div>

      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
      {error ? (
        <Alert tone="error">
          <span className="font-semibold">{t("loadErrorTitle")}</span>
          {errorMessage ? ` — ${errorMessage}` : null}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            {tCommon("retry")}
          </button>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("stats.total")}
          value={String(total)}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label={t("stats.active")}
          value={loading ? "…" : String(activeCount)}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label={t("stats.head")}
          value={loading ? "…" : String(headCount)}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t("directoryTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("directoryDescription")}</p>
        </div>
        <label className="relative block w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="pl-9"
          />
        </label>
      </div>

      <DataTable<Branch>
        data={items}
        columns={columns}
        getRowKey={(row) => String(row.branchId)}
        loading={loading}
        error={error}
        errorTitle={t("loadErrorTitle")}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((key) => key + 1)}
        emptyTitle={t("emptyTitle")}
        emptyMessage={t("emptyMessage")}
        minWidth="920px"
        caption={t("tableCaption")}
        rowActions={{
          header: t("columns.actions"),
          render: (row) => (
            <div className="inline-flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Pencil}
                tooltip={t("edit")}
                onClick={() => openEdit(row)}
              />
              <Button
                type="button"
                variant={row.isActive ? "warning" : "success"}
                size="sm"
                icon={row.isActive ? Ban : CircleCheck}
                tooltip={row.isActive ? t("deactivate") : t("activate")}
                disabled={statusBusyId === row.branchId}
                onClick={() => void handleToggleStatus(row)}
              />
            </div>
          ),
        }}
        pagination={{
          page,
          pageSize,
          total: meta?.total ?? items.length,
          totalPages: meta?.lastPage,
          pageSizeOptions: [10, 20, 50],
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
      />

      <BranchForm
        open={formOpen}
        mode={formMode}
        branch={editing}
        saving={saving}
        errorMessage={formError}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
    </>
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
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p
        className={`mt-2 inline-flex rounded-xl px-2.5 py-1 text-lg font-semibold ${tone}`}
      >
        {value}
      </p>
    </div>
  );
}
