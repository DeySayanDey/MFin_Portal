"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { securityModulePages } from "@/lib/modules/module.types";
import {
  AuditLogFilters,
  type AuditLogFilterValues,
} from "@/features/security/audit-log/components/AuditLogFilters";
import { AuditLogTable } from "@/features/security/audit-log/components/AuditLogTable";
import { AuditLogDetail } from "@/features/security/audit-log/components/AuditLogDetail";
import {
  fetchAuditLogList,
  isAuditLogClientError,
} from "@/features/security/audit-log/services/audit-log-client";
import type {
  AuditLog,
  PaginationMeta,
} from "@/features/security/audit-log/types/audit-log.types";
import { AUDIT_LOG_DEFAULT_PER_PAGE } from "@/features/security/audit-log/types/audit-log.types";

const DEFAULT_FILTERS: AuditLogFilterValues = {
  search: "",
  action: "",
  menuName: "",
  dateFrom: "",
  dateTo: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: AuditLogFilterValues,
  b: AuditLogFilterValues,
): boolean {
  return (
    a.search === b.search &&
    a.action === b.action &&
    a.menuName === b.menuName &&
    a.dateFrom === b.dateFrom &&
    a.dateTo === b.dateTo
  );
}

export function AuditLogView() {
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = securityModulePages.auditLog.toJSON();

  const [filters, setFilters] =
    useState<AuditLogFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AuditLogFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(AUDIT_LOG_DEFAULT_PER_PAGE);
  const [items, setItems] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<AuditLog | null>(null);

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
        const result = await fetchAuditLogList({
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
          action:
            appliedFilters.action === ""
              ? undefined
              : Number(appliedFilters.action),
          menuName: appliedFilters.menuName.trim() || undefined,
          fromDate: appliedFilters.dateFrom || undefined,
          toDate: appliedFilters.dateTo || undefined,
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (cancelled) return;
        if (isAuditLogClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isAuditLogClientError(err) ? err.message : tErrors("generic"),
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

  return (
    <ModulePageShell page={pageMeta}>
      <AuditLogFilters
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
        }}
      />

      <AuditLogTable
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
        onView={(row) => {
          setSelected(row);
          setDetailOpen(true);
        }}
      />

      <AuditLogDetail
        open={detailOpen}
        row={selected}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
      />
    </ModulePageShell>
  );
}
