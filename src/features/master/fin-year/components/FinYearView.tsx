"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { DataPage } from "@/components/shared/DataPage";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { masterModulePages } from "@/lib/modules/module.types";
import {
  FinYearFilters,
  type FinYearFilterValues,
} from "@/features/master/fin-year/components/FinYearFilters";
import { FinYearTable } from "@/features/master/fin-year/components/FinYearTable";
import { FinYearForm } from "@/features/master/fin-year/components/FinYearForm";
import {
  fetchFinYearList,
  isFinYearClientError,
  saveFinYear,
} from "@/features/master/fin-year/services/fin-year-client";
import type {
  FinYear,
  FinYearSaveInput,
  PaginationMeta,
} from "@/features/master/fin-year/types/fin-year.types";
import { FIN_YEAR_DEFAULT_PER_PAGE } from "@/features/master/fin-year/types/fin-year.types";

const DEFAULT_FILTERS: FinYearFilterValues = {
  search: "",
  isActive: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(a: FinYearFilterValues, b: FinYearFilterValues): boolean {
  return a.search === b.search && a.isActive === b.isActive;
}

export function FinYearView() {
  const t = useTranslations("master.finYear");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.finYear.toJSON();

  const [filters, setFilters] = useState<FinYearFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FinYearFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(FIN_YEAR_DEFAULT_PER_PAGE);
  const [items, setItems] = useState<FinYear[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<FinYear | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<FinYear | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

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
        const result = await fetchFinYearList({
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
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
        if (isFinYearClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isFinYearClientError(err) ? err.message : tErrors("generic"),
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

  function openEdit(year: FinYear) {
    setFormMode("edit");
    setEditing(year);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(input: FinYearSaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveFinYear(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(
        input.yearId != null ? t("updateSuccess") : t("createSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isFinYearClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(isFinYearClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  function handleToggleActive(year: FinYear) {
    setStatusConfirmTarget(year);
  }

  async function executeToggleActive(year: FinYear) {
    const nextActive = !year.isActive;
    setStatusBusyId(year.yearId);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await saveFinYear({
        yearId: year.yearId,
        yearName: year.yearName,
        startDate: year.startDate,
        endDate: year.endDate,
        isActive: nextActive,
      });
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isFinYearClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setActionError(
        isFinYearClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <DataPage page={pageMeta}>
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <FinYearFilters
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <FinYearTable
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
        onToggleActive={handleToggleActive}
        headerActions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("add")}
          </Button>
        }
      />

      <FinYearForm
        open={formOpen}
        mode={formMode}
        year={editing}
        saving={saving}
        errorMessage={formError}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(statusConfirmTarget)}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={async () => {
          if (!statusConfirmTarget) return;
          const target = statusConfirmTarget;
          setStatusConfirmTarget(null);
          await executeToggleActive(target);
        }}
        actionType={
          statusConfirmTarget?.isActive ? "deactivate" : "activate"
        }
        itemName={statusConfirmTarget?.yearName}
        itemType="Financial Year"
      />
    </DataPage>
  );
}
