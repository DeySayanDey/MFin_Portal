"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Alert } from "@/components/ui/Alert";
import {
  CodeSeriesFilters,
  type CodeSeriesFilterValues,
} from "@/features/master/code-series/components/CodeSeriesFilters";
import { CodeSeriesTable } from "@/features/master/code-series/components/CodeSeriesTable";
import { CodeSeriesForm } from "@/features/master/code-series/components/CodeSeriesForm";
import {
  fetchCodeSeriesList,
  isCodeSeriesClientError,
  saveCodeSeries,
} from "@/features/master/code-series/services/code-series-client";
import type {
  CodeSeries,
  CodeSeriesUpdateInput,
  PaginationMeta,
} from "@/features/master/code-series/types/code-series.types";

const DEFAULT_FILTERS: CodeSeriesFilterValues = {
  keyword: "",
  moduleKey: "",
  status: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: CodeSeriesFilterValues,
  b: CodeSeriesFilterValues,
): boolean {
  return (
    a.keyword === b.keyword &&
    a.moduleKey === b.moduleKey &&
    a.status === b.status
  );
}

export function CodeSeriesView() {
  const t = useTranslations("master.codeSeries");
  const tErrors = useTranslations("errors");
  const router = useRouter();

  const [filters, setFilters] = useState<CodeSeriesFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<CodeSeriesFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<CodeSeries[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState<CodeSeries | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live filters → API (one search, no Apply click needed)
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
        const result = await fetchCodeSeriesList({
          page,
          perPage: pageSize,
          keyword: appliedFilters.keyword.trim() || undefined,
          moduleKey: appliedFilters.moduleKey.trim() || undefined,
          status:
            appliedFilters.status === ""
              ? undefined
              : Number(appliedFilters.status),
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (cancelled) return;
        if (isCodeSeriesClientError(err) && err.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setError(true);
        setErrorMessage(
          isCodeSeriesClientError(err) ? err.message : tErrors("generic"),
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

  function handleResetFilters() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
    setSuccessMessage(null);
  }

  async function handleSave(input: CodeSeriesUpdateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveCodeSeries(input);
      setEditing(null);
      setSuccessMessage(t("saveSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isCodeSeriesClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setFormError(
        isCodeSeriesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(series: CodeSeries) {
    const nextActive = series.status !== 1;
    setStatusBusyId(series.seriesId);
    setSuccessMessage(null);
    try {
      await saveCodeSeries({
        seriesId: series.seriesId,
        nextCounter: series.nextCounter,
        paddingDigits: series.paddingDigits,
        prefix: series.prefix,
        suffix: series.suffix,
        status: nextActive ? 1 : 0,
      });
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isCodeSeriesClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setError(true);
      setErrorMessage(
        isCodeSeriesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  const totalLabel =
    meta != null
      ? t("configuredCount", { count: meta.total })
      : t("configuredCount", { count: items.length });

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-blue-900">
            {t("bannerTitle")}
          </h2>
          <p className="mt-1 text-sm text-blue-800/80">{t("bannerHint")}</p>
        </div>
        <span className="w-fit rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          {totalLabel}
        </span>
      </div>

      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      <CodeSeriesFilters
        values={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">
          {t("tableHeading")}
        </h3>
        <CodeSeriesTable
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
          onConfigure={(row) => {
            setFormError(null);
            setEditing(row);
          }}
          onToggleStatus={handleToggleStatus}
        />
      </section>

      <CodeSeriesForm
        open={Boolean(editing)}
        series={editing}
        saving={saving}
        errorMessage={formError}
        onClose={() => {
          if (saving) return;
          setEditing(null);
          setFormError(null);
        }}
        onSubmit={handleSave}
      />
    </div>
  );
}
