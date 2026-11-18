"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { masterModulePages } from "@/lib/modules/module.types";
import { fetchApplOptions } from "@/features/master/appl-options";
import type { ApplOption } from "@/features/master/appl-options";
import { isDepositSchemesClientError } from "@/features/master/deposit-schemes/services/deposit-schemes-client";
import {
  DepositInterestFilters,
  type DepositInterestFilterValues,
} from "./DepositInterestFilters";
import { DepositInterestTable } from "./DepositInterestTable";
import { DepositInterestForm } from "./DepositInterestForm";
import {
  fetchDepositSchemeSlabs,
  fetchTermDepositSchemeOptions,
  isDepositInterestClientError,
  saveDepositSchemeSlab,
  toggleDepositSchemeSlabStatus,
} from "../services/deposit-interest-client";
import type {
  DepositSchemeSlab,
  DepositSchemeSlabSaveInput,
  PaginationMeta,
} from "../types/deposit-interest.types";

const DEFAULT_FILTERS: DepositInterestFilterValues = {
  search: "",
  schemeId: "",
  termCd: "",
  isActive: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: DepositInterestFilterValues,
  b: DepositInterestFilterValues,
): boolean {
  return (
    a.search === b.search &&
    a.schemeId === b.schemeId &&
    a.termCd === b.termCd &&
    a.isActive === b.isActive
  );
}

export function DepositInterestView() {
  const t = useTranslations("master.depositInterest");
  const tErrors = useTranslations("errors");
  const pageMeta = useMemo(
    () => masterModulePages.depositInterest.toJSON(),
    [],
  );

  const [filters, setFilters] =
    useState<DepositInterestFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<DepositInterestFilterValues>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [items, setItems] = useState<DepositSchemeSlab[]>([]);
  const [availableSchemes, setAvailableSchemes] = useState<
    { id: number; schemeName: string }[]
  >([]);
  const [termOptions, setTermOptions] = useState<ApplOption[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<DepositSchemeSlab | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

  // Load auxiliary data (Deposit Schemes list + Term Units)
  useEffect(() => {
    let cancelled = false;
    async function loadAuxiliaryOptions() {
      const [schemeResult, termResult] = await Promise.allSettled([
        fetchTermDepositSchemeOptions(),
        fetchApplOptions(7), // Group 7: Term
      ]);
      if (!cancelled) {
        if (schemeResult.status === "fulfilled") {
          setAvailableSchemes(schemeResult.value);
        } else {
          setAvailableSchemes([]);
          setActionError(
            isDepositSchemesClientError(schemeResult.reason)
              ? schemeResult.reason.message
              : tErrors("generic"),
          );
        }
        if (termResult.status === "fulfilled") setTermOptions(termResult.value);
      }
    }
    void loadAuxiliaryOptions();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, setActionError, tErrors]);

  // Debounce filters
  useEffect(() => {
    if (filtersEqual(filters, appliedFilters)) return;
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedFilters(filters);
      setSuccessMessage(null);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters, appliedFilters, setSuccessMessage]);

  // Load slabs data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchDepositSchemeSlabs({
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
          schemeId: appliedFilters.schemeId
            ? Number(appliedFilters.schemeId)
            : undefined,
          termCd: appliedFilters.termCd
            ? Number(appliedFilters.termCd)
            : undefined,
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
          isDepositInterestClientError(err) ? err.message : tErrors("generic"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, reloadKey, appliedFilters, tErrors]);

  function openCreate() {
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(input: DepositSchemeSlabSaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveDepositSchemeSlab(input);
      setFormOpen(false);
      setSuccessMessage(t("createSuccess", { fallback: "Deposit interest slab created successfully." }));
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(
        isDepositInterestClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(item: DepositSchemeSlab) {
    const nextActive = !item.isActive;
    setStatusBusyId(item.id);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await toggleDepositSchemeSlabStatus(item.id, nextActive);
      setSuccessMessage(
        nextActive
          ? t("activateSuccess", { fallback: "Deposit interest slab activated successfully." })
          : t("deactivateSuccess", { fallback: "Deposit interest slab deactivated successfully." }),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(
        isDepositInterestClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <DepositInterestFilters
        values={filters}
        schemes={availableSchemes}
        termOptions={termOptions}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <DepositInterestTable
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
        onToggleActive={setStatusConfirmTarget}
        headerActions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("add", { fallback: "Add Slab" })}
          </Button>
        }
      />

      <DepositInterestForm
        open={formOpen}
        schemes={availableSchemes}
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
        actionType={statusConfirmTarget?.isActive ? "deactivate" : "activate"}
        itemName={
          statusConfirmTarget
            ? `${statusConfirmTarget.schemeName} (${statusConfirmTarget.minDuration}–${statusConfirmTarget.maxDuration} ${statusConfirmTarget.termDesc})`
            : undefined
        }
        itemType={t("confirmItemType", { fallback: "Interest Slab" })}
      />
    </ModulePageShell>
  );
}
