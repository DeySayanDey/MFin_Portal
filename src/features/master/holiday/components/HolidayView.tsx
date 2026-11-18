"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { masterModulePages } from "@/lib/modules/module.types";
import {
  HolidayFilters,
  type HolidayFilterValues,
} from "@/features/master/holiday/components/HolidayFilters";
import { HolidayTable } from "@/features/master/holiday/components/HolidayTable";
import { HolidayForm } from "@/features/master/holiday/components/HolidayForm";
import {
  fetchHolidayList,
  isHolidayClientError,
  saveHoliday,
} from "@/features/master/holiday/services/holiday-client";
import {
  fetchFinYearList,
  isFinYearClientError,
} from "@/features/master/fin-year/services/fin-year-client";
import type {
  Holiday,
  HolidaySaveInput,
  PaginationMeta,
} from "@/features/master/holiday/types/holiday.types";
import { HOLIDAY_DEFAULT_PER_PAGE } from "@/features/master/holiday/types/holiday.types";
import type { FinYear } from "@/features/master/fin-year/types/fin-year.types";

const DEFAULT_FILTERS: HolidayFilterValues = {
  search: "",
  yearSl: "",
  holiType: "",
  fromDate: "",
  toDate: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(a: HolidayFilterValues, b: HolidayFilterValues): boolean {
  return (
    a.search === b.search &&
    a.yearSl === b.yearSl &&
    a.holiType === b.holiType &&
    a.fromDate === b.fromDate &&
    a.toDate === b.toDate
  );
}

export function HolidayView() {
  const t = useTranslations("master.holiday");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.holiday.toJSON();

  const [filters, setFilters] = useState<HolidayFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<HolidayFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(HOLIDAY_DEFAULT_PER_PAGE);
  const [items, setItems] = useState<Holiday[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [finYears, setFinYears] = useState<FinYear[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();

  const yearOptions = useMemo(
    () =>
      finYears.map((year) => ({
        value: String(year.yearId),
        label: year.yearName,
      })),
    [finYears],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadYears() {
      try {
        const result = await fetchFinYearList({ perPage: 200 });
        if (cancelled) return;
        setFinYears(result.items);
      } catch (err) {
        if (cancelled) return;
        if (isFinYearClientError(err) && err.status === 401) {
          router.replace("/login");
        }
      }
    }

    void loadYears();
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
        const result = await fetchHolidayList({
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
          yearSl:
            appliedFilters.yearSl === ""
              ? undefined
              : Number(appliedFilters.yearSl),
          holiType:
            appliedFilters.holiType === ""
              ? undefined
              : Number(appliedFilters.holiType),
          fromDate: appliedFilters.fromDate || undefined,
          toDate: appliedFilters.toDate || undefined,
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (cancelled) return;
        if (isHolidayClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isHolidayClientError(err) ? err.message : tErrors("generic"),
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

  function openEdit(holiday: Holiday) {
    setFormMode("edit");
    setEditing(holiday);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(input: HolidaySaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveHoliday(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(
        input.id != null ? t("updateSuccess") : t("createSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isHolidayClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(isHolidayClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />

      <HolidayFilters
        values={filters}
        yearOptions={yearOptions}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <HolidayTable
        items={items}
        meta={meta}
        page={page}
        pageSize={pageSize}
        loading={loading}
        error={error}
        errorMessage={errorMessage}
        onRetry={() => setReloadKey((key) => key + 1)}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onEdit={openEdit}
        headerActions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("add")}
          </Button>
        }
      />

      <HolidayForm
        open={formOpen}
        mode={formMode}
        holiday={editing}
        yearOptions={yearOptions}
        saving={saving}
        errorMessage={formError}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        onSubmit={handleSave}
      />
    </ModulePageShell>
  );
}
