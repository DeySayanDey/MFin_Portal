"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { masterModulePages } from "@/lib/modules/module.types";
import { fetchLoanSchemeSetups } from "@/features/master/loan-schemes/services/loan-schemes-client";
import {
  LoanRoiSlabsFilters,
  type LoanRoiSlabFilterValues,
} from "./LoanRoiSlabsFilters";
import { LoanRoiSlabsTable } from "./LoanRoiSlabsTable";
import { LoanRoiSlabsForm } from "./LoanRoiSlabsForm";
import {
  fetchLoanSchemeSlabs,
  isLoanRoiSlabsClientError,
  saveLoanSchemeSlab,
  toggleLoanSchemeSlabStatus,
} from "../services/loan-roi-slabs-client";
import type {
  LoanSchemeChoice,
  LoanSchemeSlab,
  LoanSchemeSlabSaveInput,
  PaginationMeta,
} from "../types/loan-roi-slabs.types";

const DEFAULT_FILTERS: LoanRoiSlabFilterValues = {
  schemeId: "",
  amount: "",
  effectiveOn: "",
  isActive: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: LoanRoiSlabFilterValues,
  b: LoanRoiSlabFilterValues,
): boolean {
  return (
    a.schemeId === b.schemeId &&
    a.amount === b.amount &&
    a.effectiveOn === b.effectiveOn &&
    a.isActive === b.isActive
  );
}

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function readFilterAmount(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function LoanRoiSlabsView() {
  const t = useTranslations("master.loanRoiSlabs");
  const tErrors = useTranslations("errors");
  const pageMeta = useMemo(() => masterModulePages.loanRoiSlabs.toJSON(), []);

  const [filters, setFilters] = useState<LoanRoiSlabFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<LoanRoiSlabFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [items, setItems] = useState<LoanSchemeSlab[]>([]);
  const [schemes, setSchemes] = useState<LoanSchemeChoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoanSchemeSlab | null>(null);
  const [defaultDate, setDefaultDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<LoanSchemeSlab | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

  useEffect(() => {
    let cancelled = false;
    async function loadSchemes() {
      try {
        const choices: LoanSchemeChoice[] = [];
        let nextPage = 1;
        let lastPage = 1;
        do {
          const result = await fetchLoanSchemeSetups({
            page: nextPage,
            perPage: 200,
          });
          for (const scheme of result.items) {
            choices.push({
              id: scheme.id,
              schemeCode: scheme.schemeCode,
              schemeName: scheme.schemeName,
              repayScheduleDesc: scheme.repayScheduleDesc,
              isActive: scheme.isActive,
            });
          }
          lastPage = result.meta?.lastPage ?? nextPage;
          nextPage += 1;
        } while (nextPage <= lastPage && nextPage <= 10);
        if (!cancelled) setSchemes(choices);
      } catch {
        if (!cancelled) setSchemes([]);
      }
    }
    void loadSchemes();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (filtersEqual(filters, appliedFilters)) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedFilters(filters);
      setSuccessMessage(null);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [appliedFilters, filters, setSuccessMessage]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchLoanSchemeSlabs({
          page,
          perPage: pageSize,
          schemeId: appliedFilters.schemeId
            ? Number(appliedFilters.schemeId)
            : undefined,
          amount: readFilterAmount(appliedFilters.amount),
          effectiveOn: appliedFilters.effectiveOn || undefined,
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
        setError(true);
        setErrorMessage(
          isLoanRoiSlabsClientError(err) ? err.message : tErrors("generic"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, page, pageSize, reloadKey, tErrors]);

  function openCreate() {
    setEditing(null);
    setDefaultDate(localToday());
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(row: LoanSchemeSlab) {
    setEditing(row);
    setDefaultDate(row.effectFrom);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(input: LoanSchemeSlabSaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveLoanSchemeSlab(input);
      setFormOpen(false);
      setSuccessMessage(input.id ? t("updateSuccess") : t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(
        isLoanRoiSlabsClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(item: LoanSchemeSlab) {
    const nextActive = !item.isActive;
    setStatusBusyId(item.id);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await toggleLoanSchemeSlabStatus(item.id, nextActive);
      setSuccessMessage(nextActive ? t("activateSuccess") : t("deactivateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(
        isLoanRoiSlabsClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <LoanRoiSlabsFilters
        values={filters}
        schemes={schemes}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <LoanRoiSlabsTable
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
        onToggleActive={setStatusConfirmTarget}
        headerActions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("add")}
          </Button>
        }
      />

      {formOpen ? (
        <LoanRoiSlabsForm
          key={editing?.id ?? "create"}
          mode={editing ? "edit" : "create"}
          slab={editing}
          schemes={schemes}
          defaultDate={defaultDate}
          saving={saving}
          errorMessage={formError}
          onClose={() => {
            if (saving) return;
            setFormOpen(false);
            setFormError(null);
          }}
          onSubmit={handleSave}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(statusConfirmTarget)}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={async () => {
          if (!statusConfirmTarget) return;
          const target = statusConfirmTarget;
          setStatusConfirmTarget(null);
          await executeToggleActive(target);
        }}
        actionType={statusConfirmTarget?.isActive ? "deactivate" : "activate"}
        itemName={
          statusConfirmTarget
            ? `${statusConfirmTarget.schemeName} (${statusConfirmTarget.minAmount}–${statusConfirmTarget.maxAmount})`
            : undefined
        }
        itemType={t("confirmItemType")}
      />
    </ModulePageShell>
  );
}
