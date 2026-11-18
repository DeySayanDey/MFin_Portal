"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { masterModulePages } from "@/lib/modules/module.types";
import {
  AcctCategoryFilters,
  type AcctCategoryFilterValues,
} from "@/features/master/acct-category/components/AcctCategoryFilters";
import { AcctCategoryTable } from "@/features/master/acct-category/components/AcctCategoryTable";
import {
  fetchAcctCategoryList,
  isAcctCategoryClientError,
} from "@/features/master/acct-category/services/acct-category-client";
import type {
  AcctCategory,
  PaginationMeta,
} from "@/features/master/acct-category/types/acct-category.types";
import { ACCT_CATEGORY_DEFAULT_PER_PAGE } from "@/features/master/acct-category/types/acct-category.types";

const DEFAULT_FILTERS: AcctCategoryFilterValues = {
  keyword: "",
  categoryType: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: AcctCategoryFilterValues,
  b: AcctCategoryFilterValues,
): boolean {
  return a.keyword === b.keyword && a.categoryType === b.categoryType;
}

export type AcctCategoryViewProps = {
  embedded?: boolean;
};

export function AcctCategoryView({
  embedded = false,
}: AcctCategoryViewProps = {}) {
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.acctCategory.toJSON();

  const [filters, setFilters] =
    useState<AcctCategoryFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AcctCategoryFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ACCT_CATEGORY_DEFAULT_PER_PAGE);
  const [items, setItems] = useState<AcctCategory[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (filtersEqual(filters, appliedFilters)) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedFilters(filters);
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
        const result = await fetchAcctCategoryList({
          page,
          perPage: pageSize,
          keyword: appliedFilters.keyword.trim() || undefined,
          categoryType: appliedFilters.categoryType || undefined,
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (cancelled) return;
        if (isAcctCategoryClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isAcctCategoryClientError(err) ? err.message : tErrors("generic"),
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

  const body = (
    <>
      <AcctCategoryFilters
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
        }}
      />

      <AcctCategoryTable
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
      />
    </>
  );

  if (embedded) {
    return <div className="flex min-w-0 flex-col gap-4 sm:gap-5">{body}</div>;
  }

  return <ModulePageShell page={pageMeta}>{body}</ModulePageShell>;
}
