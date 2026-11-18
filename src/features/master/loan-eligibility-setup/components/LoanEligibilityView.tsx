"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { masterModulePages } from "@/lib/modules/module.types";
import {
  LoanEligibilityFilters,
  type LoanEligibilityFilterValues,
} from "./LoanEligibilityFilters";
import { LoanEligibilityTable } from "./LoanEligibilityTable";
import { LoanEligibilityForm } from "./LoanEligibilityForm";
import {
  fetchLoanEligibilityParameters,
  isLoanEligibilityClientError,
  saveLoanEligibilityParameter,
  toggleLoanEligibilityStatus,
} from "../services/loan-eligibility-client";
import type {
  LoanEligibilityParameter,
  LoanEligibilitySaveInput,
  PaginationMeta,
} from "../types/loan-eligibility.types";

const DEFAULT_FILTERS: LoanEligibilityFilterValues = {
  search: "",
  dataType: "",
  isMandatory: "",
  isActive: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: LoanEligibilityFilterValues,
  b: LoanEligibilityFilterValues,
): boolean {
  return (
    a.search === b.search &&
    a.dataType === b.dataType &&
    a.isMandatory === b.isMandatory &&
    a.isActive === b.isActive
  );
}

export function LoanEligibilityView() {
  const t = useTranslations("master.loanEligibility");
  const tErrors = useTranslations("errors");
  const pageMeta = useMemo(
    () => masterModulePages.loanEligibility.toJSON(),
    [],
  );

  const [filters, setFilters] =
    useState<LoanEligibilityFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<LoanEligibilityFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [items, setItems] = useState<LoanEligibilityParameter[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState<LoanEligibilityParameter | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<LoanEligibilityParameter | null>(null);
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
  }, [appliedFilters, filters, setSuccessMessage]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchLoanEligibilityParameters({
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
          dataType: appliedFilters.dataType || undefined,
          isMandatory:
            appliedFilters.isMandatory === ""
              ? undefined
              : Number(appliedFilters.isMandatory),
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
          isLoanEligibilityClientError(err) ? err.message : tErrors("generic"),
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

  function openEdit(row: LoanEligibilityParameter) {
    setFormError(null);
    setEditing(row);
  }

  async function handleSave(input: LoanEligibilitySaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveLoanEligibilityParameter(input);
      setEditing(null);
      setSuccessMessage(t("updateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(
        isLoanEligibilityClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(item: LoanEligibilityParameter) {
    const nextActive = !item.isActive;
    setStatusBusyId(item.paramId);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await toggleLoanEligibilityStatus(item.paramId, nextActive);
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(
        isLoanEligibilityClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <LoanEligibilityFilters
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <LoanEligibilityTable
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
      />

      {editing ? (
        <LoanEligibilityForm
          key={editing.paramId}
          parameter={editing}
          saving={saving}
          errorMessage={formError}
          onClose={() => {
            if (saving) return;
            setEditing(null);
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
        itemName={statusConfirmTarget?.parameterName}
        itemType={t("confirmItemType")}
      />
    </ModulePageShell>
  );
}
