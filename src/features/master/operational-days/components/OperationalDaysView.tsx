"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { masterModulePages } from "@/lib/modules/module.types";
import {
  OperationalDayFilters,
  type OperationalDayFilterValues,
} from "@/features/master/operational-days/components/OperationalDayFilters";
import { OperationalDayTable } from "@/features/master/operational-days/components/OperationalDayTable";
import { OperationalDayForm } from "@/features/master/operational-days/components/OperationalDayForm";
import {
  saveOperationalDaysBulk,
  fetchOperationalDayList,
  isOperationalDaysClientError,
  updateOperationalDay,
} from "@/features/master/operational-days/services/operational-days-client";
import {
  fetchBranchList,
  isBranchClientError,
} from "@/features/master/branch/services/branch-client";
import type { Branch } from "@/features/master/branch/types/branch.types";
import type {
  OperationalDay,
  OperationalDayCreateInput,
  OperationalDayUpdateInput,
  PaginationMeta,
} from "@/features/master/operational-days/types/operational-days.types";
import { OPERATIONAL_DAYS_DEFAULT_PER_PAGE } from "@/features/master/operational-days/types/operational-days.types";

const DEFAULT_FILTERS: OperationalDayFilterValues = {
  branchId: "",
  dayOfWeek: "",
  isOperational: "",
  isActive: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: OperationalDayFilterValues,
  b: OperationalDayFilterValues,
): boolean {
  return (
    a.branchId === b.branchId &&
    a.dayOfWeek === b.dayOfWeek &&
    a.isOperational === b.isOperational &&
    a.isActive === b.isActive
  );
}

export function OperationalDaysView() {
  const t = useTranslations("master.operationalDays");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.operationalDays.toJSON();

  const [filters, setFilters] =
    useState<OperationalDayFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<OperationalDayFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(OPERATIONAL_DAYS_DEFAULT_PER_PAGE);
  const [items, setItems] = useState<OperationalDay[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<OperationalDay | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<OperationalDay | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();

  const dayOptions = useMemo(
    () =>
      (
        [
          ["1", "days.1"],
          ["2", "days.2"],
          ["3", "days.3"],
          ["4", "days.4"],
          ["5", "days.5"],
          ["6", "days.6"],
          ["7", "days.7"],
        ] as const
      ).map(([value, key]) => ({
        value,
        label: t(key),
      })),
    [t],
  );

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
    () =>
      branches.map((branch) => ({
        value: String(branch.branchId),
        label: `${branch.branchCode} · ${branch.branchName}`,
      })),
    [branches],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const result = await fetchBranchList({
          page: 1,
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
    if (filtersEqual(filters, appliedFilters)) return;
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
        const result = await fetchOperationalDayList({
          page,
          perPage: pageSize,
          branchId:
            appliedFilters.branchId === ""
              ? undefined
              : Number(appliedFilters.branchId),
          dayOfWeek:
            appliedFilters.dayOfWeek === ""
              ? undefined
              : Number(appliedFilters.dayOfWeek),
          isOperational:
            appliedFilters.isOperational === ""
              ? undefined
              : Number(appliedFilters.isOperational),
          isActive:
            appliedFilters.isActive === ""
              ? undefined
              : Number(appliedFilters.isActive),
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (cancelled) return;
        if (isOperationalDaysClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isOperationalDaysClientError(err) ? err.message : tErrors("generic"),
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

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(day: OperationalDay) {
    setFormMode("edit");
    setEditing(day);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleCreate(inputs: OperationalDayCreateInput[]): Promise<number[]> {
    return handleBulkSave(inputs, "create");
  }

  async function handleUpdate(inputs: OperationalDayUpdateInput[]): Promise<number[]> {
    return handleBulkSave(inputs, "edit");
  }

  async function handleBulkSave(inputs: (OperationalDayCreateInput | OperationalDayUpdateInput)[], mode: "create" | "edit"): Promise<number[]> {
    setSaving(true);
    setFormError(null);
    try {
      const first = inputs[0];
      if (!first) return [];
      await saveOperationalDaysBulk({
        branchId: first.branchId,
        days: inputs.map((input) => ({
          dayOfWeek: input.dayOfWeek,
          ...("recId" in input ? { recId: input.recId } : {}),
        })),
        isOperational: first.isOperational,
        isHalfDay: first.isHalfDay,
        openTime: first.openTime,
        closeTime: first.closeTime,
        isActive: first.isActive,
      });
      setReloadKey((key) => key + 1);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(mode === "create" ? t("createSuccess") : t("updateSuccess"));
      return [];
    } catch (err) {
      if (isOperationalDaysClientError(err) && err.status === 401) {
        router.replace("/login");
      } else {
        setFormError(isOperationalDaysClientError(err) ? err.message : tErrors("generic"));
      }
      return inputs.map((item) => item.dayOfWeek);
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus(day: OperationalDay) {
    setStatusConfirmTarget(day);
  }

  async function executeToggleStatus(day: OperationalDay) {
    const nextActive = !day.isActive;
    setStatusBusyId(day.recId);
    setSuccessMessage(null);
    try {
      await updateOperationalDay({
        recId: day.recId,
        branchId: day.branchId,
        dayOfWeek: day.dayOfWeek,
        isOperational: day.isOperational,
        isHalfDay: day.isHalfDay,
        openTime: day.openTime,
        closeTime: day.closeTime,
        isActive: nextActive,
      });
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isOperationalDaysClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(true);
      setErrorMessage(
        isOperationalDaysClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />

      <OperationalDayFilters
        values={filters}
        branchOptions={filterBranchOptions}
        dayOptions={dayOptions}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <OperationalDayTable
        items={items}
        meta={meta}
        page={page}
        pageSize={pageSize}
        loading={loading}
        error={error}
        errorMessage={errorMessage}
        statusBusyId={statusBusyId}
        onRetry={() => setReloadKey((key) => key + 1)}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onEdit={openEdit}
        onToggleStatus={(row) => void handleToggleStatus(row)}
        headerActions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("add")}
          </Button>
        }
      />

      <OperationalDayForm
        open={formOpen}
        mode={formMode}
        day={editing}
        branchOptions={branchOptions}
        dayOptions={dayOptions}
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
            ? `${statusConfirmTarget.branchName} - ${statusConfirmTarget.dayName}`
            : undefined
        }
        itemType="Operational Day"
      />
    </ModulePageShell>
  );
}
