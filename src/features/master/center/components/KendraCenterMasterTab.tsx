"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Ban, CircleCheck, Pencil, Plus, Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Form";
import { FilterPanel } from "@/components/shared/FilterPanel";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { CenterForm } from "@/features/master/center/components/CenterForm";
import {
  createCenter,
  fetchCenterList,
  isCenterClientError,
  updateCenter,
} from "@/features/master/center/services/center-client";
import {
  fetchBranchList,
  isBranchClientError,
} from "@/features/master/branch/services/branch-client";
import type {
  Center,
  CenterCreateInput,
  CenterUpdateInput,
  PaginationMeta,
} from "@/features/master/center/types/center.types";
import type { Branch } from "@/features/master/branch/types/branch.types";

const SEARCH_DEBOUNCE_MS = 350;

type FilterValues = {
  search: string;
  branchId: string;
  isActive: "" | "1" | "0";
};

const DEFAULT_FILTERS: FilterValues = {
  search: "",
  branchId: "",
  isActive: "",
};

type KendraCenterMasterTabProps = {
  onCentersChange?: (centers: Center[]) => void;
};

export function KendraCenterMasterTab({
  onCentersChange,
}: KendraCenterMasterTabProps) {
  const t = useTranslations("master.center");
  const tErrors = useTranslations("errors");
  const tUi = useTranslations("ui");
  const router = useRouter();
  const onCentersChangeRef = useRef(onCentersChange);
  useEffect(() => {
    onCentersChangeRef.current = onCentersChange;
  }, [onCentersChange]);

  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<Center[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [successMessage, setSuccessMessage] = useToastText();

  const [branches, setBranches] = useState<Branch[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Center | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<Center | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const branchOptions = useMemo(
    () =>
      branches
        .filter((branch) => branch.isActive)
        .map((branch) => ({
          value: String(branch.branchId),
          label: `${branch.branchCode} · ${branch.branchName}`,
        })),
    [branches],
  );

  const filterBranchOptions = useMemo(
    () => [
      { value: "", label: t("filters.branchAll") },
      ...branches.map((branch) => ({
        value: String(branch.branchId),
        label: `${branch.branchCode} · ${branch.branchName}`,
      })),
    ],
    [branches, t],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const result = await fetchBranchList({
          perPage: 200,
          isActive: 1,
        });
        if (cancelled) return;
        setBranches(result.items);
      } catch (err) {
        if (cancelled) return;
        if (isBranchClientError(err) && err.status === 401) {
          router.replace("/login");
        }
      }
    }

    void loadBranches();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (
      filters.search === appliedFilters.search &&
      filters.branchId === appliedFilters.branchId &&
      filters.isActive === appliedFilters.isActive
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedFilters(filters);
      setSuccessMessage(null);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters, appliedFilters]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchCenterList({
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
          branchId:
            appliedFilters.branchId === ""
              ? undefined
              : Number(appliedFilters.branchId),
          isActive:
            appliedFilters.isActive === ""
              ? undefined
              : Number(appliedFilters.isActive),
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
        onCentersChangeRef.current?.(result.items);
      } catch (err) {
        if (cancelled) return;
        if (isCenterClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isCenterClientError(err) ? err.message : tErrors("generic"),
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
  }, [appliedFilters, page, pageSize, reloadKey, router, tErrors]);

  const columns = useMemo<DataTableColumn<Center>[]>(
    () => [
      {
        id: "centerName",
        header: t("columns.centerName"),
        cell: (row) => (
          <span className="font-medium text-slate-800">{row.centerName}</span>
        ),
      },
      {
        id: "branch",
        header: t("columns.branch"),
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate text-slate-800">
              {row.branchName ?? `Branch #${row.branchId}`}
            </p>
            {row.branchCode ? (
              <p className="font-mono text-[11px] text-muted">{row.branchCode}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "centerAddress",
        header: t("columns.address"),
        cell: (row) => (
          <span className="text-slate-700">{row.centerAddress ?? "—"}</span>
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

  function openEdit(center: Center) {
    setFormMode("edit");
    setEditing(center);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleCreate(input: CenterCreateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await createCenter(input);
      setFormOpen(false);
      setSuccessMessage(t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isCenterClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(isCenterClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: CenterUpdateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await updateCenter(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(t("updateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isCenterClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(isCenterClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus(center: Center) {
    setStatusConfirmTarget(center);
  }

  async function executeToggleStatus(center: Center) {
    const nextActive = !center.isActive;
    setStatusBusyId(center.centerId);
    setSuccessMessage(null);
    try {
      await updateCenter({
        centerId: center.centerId,
        branchId: center.branchId,
        centerName: center.centerName,
        centerAddress: center.centerAddress,
        isActive: nextActive,
      });
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isCenterClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(true);
      setErrorMessage(
        isCenterClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  const total = meta?.total ?? items.length;
  const activeCount = items.filter((row) => row.isActive).length;

  return (
    <>
      <PageToast message={successMessage} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("stats.total")}
          value={String(total)}
          tone="bg-violet-50 text-violet-700"
        />
        <StatCard
          label={t("stats.active")}
          value={loading ? "…" : String(activeCount)}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label={t("filters.branch")}
          value={
            appliedFilters.branchId
              ? (branches.find(
                  (b) => String(b.branchId) === appliedFilters.branchId,
                )?.branchCode ?? "—")
              : t("filters.branchAll")
          }
          tone="bg-blue-50 text-blue-700"
        />
      </div>

      <FilterPanel
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      >
          <label className="relative block min-w-[14rem] flex-1 sm:max-w-md">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              {t("filters.search")}
            </span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-soft" />
              <Input
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value }))
                }
                placeholder={t("filters.searchPlaceholder")}
                className="pl-9"
              />
            </span>
          </label>
          <div className="min-w-[12rem] sm:max-w-[16rem]">
            <SelectField
              label={t("filters.branch")}
              value={filters.branchId}
              searchable
              placeholder={t("filters.branchAll")}
              searchPlaceholder={tUi("selectSearch")}
              emptyMessage={tUi("selectEmpty")}
              onChange={(branchId) =>
                setFilters((prev) => ({ ...prev, branchId }))
              }
              options={filterBranchOptions}
            />
          </div>
          <div className="min-w-[9rem] sm:max-w-[12rem]">
            <SelectField
              label={t("filters.status")}
              value={filters.isActive}
              searchable={false}
              placeholder={t("filters.statusAll")}
              searchPlaceholder={tUi("selectSearch")}
              emptyMessage={tUi("selectEmpty")}
              onChange={(isActive) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive: isActive as FilterValues["isActive"],
                }))
              }
              options={[
                { value: "", label: t("filters.statusAll") },
                { value: "1", label: t("statusActive") },
                { value: "0", label: t("statusInactive") },
              ]}
            />
          </div>
      </FilterPanel>

      <DataTable<Center>
        title={t("directoryTitle")}
        description={t("directoryDescription")}
        actions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("add")}
          </Button>
        }
        data={items}
        columns={columns}
        getRowKey={(row) => String(row.centerId)}
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
                disabled={statusBusyId === row.centerId}
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

      <CenterForm
        open={formOpen}
        mode={formMode}
        center={editing}
        branchOptions={branchOptions}
        saving={saving}
        errorMessage={formError}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={Boolean(statusConfirmTarget)}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={async () => {
          if (!statusConfirmTarget) return;
          const target = statusConfirmTarget;
          setStatusConfirmTarget(null);
          await executeToggleStatus(target);
        }}
        actionType={
          statusConfirmTarget?.isActive ? "deactivate" : "activate"
        }
        itemName={
          statusConfirmTarget
            ? `${statusConfirmTarget.centerName} (${statusConfirmTarget.branchName ?? ""})`
            : undefined
        }
        itemType="Center"
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
