"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Banknote, FileText, Plus } from "lucide-react";
import { DataPage } from "@/components/shared/DataPage";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { fetchChargeSetups } from "@/features/master/charges-setup/services/charges-setup-client";
import { masterModulePages } from "@/lib/modules/module.types";
import { LoanSchemeChargesFilters } from "./LoanSchemeChargesFilters";
import type { LoanSchemeChargesFilterValues } from "./LoanSchemeChargesFilters";
import { LoanSchemeChargesForm } from "./LoanSchemeChargesForm";
import { LoanSchemeChargesTable } from "./LoanSchemeChargesTable";
import { LoanSchemeSetupFilters } from "./LoanSchemeSetupFilters";
import type { LoanSchemeSetupFilterValues } from "./LoanSchemeSetupFilters";
import { LoanSchemeSetupForm } from "./LoanSchemeSetupForm";
import { LoanSchemeSetupTable } from "./LoanSchemeSetupTable";
import {
  fetchLoanSchemeCharges,
  fetchLoanSchemeSetups,
  getAllLoanSchemeSetups,
  isLoanSchemesClientError,
  saveLoanSchemeCharge,
  saveLoanSchemeSetup,
  toggleLoanSchemeChargeStatus,
  toggleLoanSchemeStatus,
} from "../services/loan-schemes-client";
import type {
  LoanSchemeCharge,
  LoanSchemeChargeSaveInput,
  LoanSchemeSetup,
  LoanSchemeSetupSaveInput,
  PaginationMeta,
} from "../types/loan-schemes.types";

type PanelId = "setup" | "charges";

const TAB_IDS: PanelId[] = ["setup", "charges"];
const SEARCH_DEBOUNCE_MS = 350;

function normalizeTab(value: string | null | undefined): PanelId | null {
  if (!value) return null;
  if (TAB_IDS.includes(value as PanelId)) return value as PanelId;
  return null;
}

const DEFAULT_SETUP_FILTERS: LoanSchemeSetupFilterValues = {
  search: "",
  productTypeCd: "",
  repayTypeCd: "",
  isActive: "",
};

const DEFAULT_CHARGES_FILTERS: LoanSchemeChargesFilterValues = {
  schemeId: "",
  chargeId: "",
  isActive: "",
};

export function LoanSchemesView({
  initialTab = "setup",
}: {
  initialTab?: string;
}) {
  const t = useTranslations("master.loanSchemes");
  const pageMeta = masterModulePages.loanSchemes.toJSON();
  const [activeTab, setActiveTab] = useState<PanelId>(
    () => normalizeTab(initialTab) ?? "setup",
  );

  const tabs = useMemo(
    () => [
      { id: "setup" as const, title: t("tabs.setup"), description: t("tabHints.setup"), icon: FileText },
      { id: "charges" as const, title: t("tabs.charges"), description: t("tabHints.charges"), icon: Banknote },
    ],
    [t],
  );

  useEffect(() => {
    function onPopState() {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      const next = normalizeTab(tabParam);
      if (next) setActiveTab(next);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function handleSelectTab(id: PanelId) {
    setActiveTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url.toString());
  }

  return (
    <DataPage page={pageMeta}>
      <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <SectionTabs
          tabs={tabs}
          activeId={activeTab}
          onChange={handleSelectTab}
          label={t("title")}
        />

        {activeTab === "setup" ? <SetupSection /> : null}
        {activeTab === "charges" ? <ChargesSection /> : null}
      </div>
    </DataPage>
  );
}

function SetupSection() {
  const t = useTranslations("master.loanSchemes.setup");
  const tGlobal = useTranslations("master.loanSchemes");
  const tErrors = useTranslations("errors");

  const [filters, setFilters] =
    useState<LoanSchemeSetupFilterValues>(DEFAULT_SETUP_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<LoanSchemeSetupFilterValues>(DEFAULT_SETUP_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<LoanSchemeSetup[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<LoanSchemeSetup | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<LoanSchemeSetup | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

  useEffect(() => {
    if (
      filters.search === appliedFilters.search &&
      filters.productTypeCd === appliedFilters.productTypeCd &&
      filters.repayTypeCd === appliedFilters.repayTypeCd &&
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
  }, [filters, appliedFilters, setSuccessMessage]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchLoanSchemeSetups({
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
          productTypeCd: appliedFilters.productTypeCd
            ? Number(appliedFilters.productTypeCd)
            : undefined,
          repayTypeCd: appliedFilters.repayTypeCd
            ? Number(appliedFilters.repayTypeCd)
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
          isLoanSchemesClientError(err) ? err.message : tErrors("generic"),
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
    setFormMode("create");
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(item: LoanSchemeSetup) {
    setFormMode("edit");
    setEditing(item);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(input: LoanSchemeSetupSaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveLoanSchemeSetup(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(input.schemeId ? t("updateSuccess") : t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(
        isLoanSchemesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(item: LoanSchemeSetup) {
    const nextActive = !item.isActive;
    setStatusBusyId(item.id);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await toggleLoanSchemeStatus(item.id, nextActive);
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(
        isLoanSchemesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <>
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />
      <LoanSchemeSetupFilters
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_SETUP_FILTERS);
          setAppliedFilters(DEFAULT_SETUP_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />
      <LoanSchemeSetupTable
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
      <LoanSchemeSetupForm
        open={formOpen}
        mode={formMode}
        setup={editing}
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
        itemName={statusConfirmTarget?.schemeName}
        itemType={tGlobal("confirm.itemTypeSetup")}
      />
    </>
  );
}

function ChargesSection() {
  const t = useTranslations("master.loanSchemes.charges");
  const tGlobal = useTranslations("master.loanSchemes");
  const tErrors = useTranslations("errors");

  const [filters, setFilters] =
    useState<LoanSchemeChargesFilterValues>(DEFAULT_CHARGES_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<LoanSchemeChargesFilterValues>(DEFAULT_CHARGES_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<LoanSchemeCharge[]>([]);
  const [availableSchemes, setAvailableSchemes] = useState<
    { id: number; schemeName: string }[]
  >([]);
  const [masterCharges, setMasterCharges] = useState<
    { chargeId: number; chargeName: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<LoanSchemeCharge | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<LoanSchemeCharge | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

  useEffect(() => {
    let cancelled = false;
    async function loadAuxiliaryOptions() {
      try {
        const [schemes, charges] = await Promise.all([
          getAllLoanSchemeSetups(),
          loadActiveMasterCharges(),
        ]);
        if (!cancelled) {
          setAvailableSchemes(schemes);
          setMasterCharges(charges);
        }
      } catch {
        // Dropdowns stay empty until the next reload.
      }
    }
    void loadAuxiliaryOptions();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (
      filters.schemeId === appliedFilters.schemeId &&
      filters.chargeId === appliedFilters.chargeId &&
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
  }, [filters, appliedFilters, setSuccessMessage]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const collected: LoanSchemeCharge[] = [];
        let pageNo = 1;
        let lastPage = 1;
        do {
          const result = await fetchLoanSchemeCharges({
            page: pageNo,
            perPage: 200,
            schemeId: appliedFilters.schemeId
              ? Number(appliedFilters.schemeId)
              : undefined,
            chargeId: appliedFilters.chargeId
              ? Number(appliedFilters.chargeId)
              : undefined,
            isActive:
              appliedFilters.isActive === ""
                ? undefined
                : Number(appliedFilters.isActive),
          });
          if (cancelled) return;
          collected.push(...result.items);
          lastPage = result.meta?.lastPage ?? 1;
          pageNo += 1;
        } while (pageNo <= lastPage && pageNo <= 20);
        if (cancelled) return;
        setItems(collected);
      } catch (err) {
        if (cancelled) return;
        setError(true);
        setErrorMessage(
          isLoanSchemesClientError(err) ? err.message : tErrors("generic"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, appliedFilters, tErrors]);

  async function handleSave(input: LoanSchemeChargeSaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      const result = await saveLoanSchemeCharge(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(
        input.mode === "edit"
          ? t("updateSuccess", result.summary)
          : t("createSuccess", result.summary),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(
        isLoanSchemesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(item: LoanSchemeCharge) {
    const nextActive = !item.isActive;
    setStatusBusyId(item.id);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await toggleLoanSchemeChargeStatus(item.id, nextActive);
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(
        isLoanSchemesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <>
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />
      <LoanSchemeChargesFilters
        values={filters}
        schemes={availableSchemes}
        charges={masterCharges}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_CHARGES_FILTERS);
          setAppliedFilters(DEFAULT_CHARGES_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />
      <LoanSchemeChargesTable
        items={items}
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
        onEdit={(item) => {
          setFormMode("edit");
          setEditing(item);
          setFormError(null);
          setFormOpen(true);
        }}
        onToggleActive={setStatusConfirmTarget}
        headerActions={
          <Button
            type="button"
            icon={Plus}
            onClick={() => {
              setFormMode("create");
              setEditing(null);
              setFormError(null);
              setFormOpen(true);
            }}
          >
            {t("add")}
          </Button>
        }
      />
      <LoanSchemeChargesForm
        open={formOpen}
        mode={formMode}
        charge={editing}
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
            ? [statusConfirmTarget.schemeName, statusConfirmTarget.chargeName]
                .filter(Boolean)
                .join(" — ")
            : undefined
        }
        itemType={tGlobal("confirm.itemTypeCharge")}
      />
    </>
  );
}

async function loadActiveMasterCharges(): Promise<
  { chargeId: number; chargeName: string }[]
> {
  const items: { chargeId: number; chargeName: string }[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await fetchChargeSetups("loan", {
      isActive: 1,
      page,
      perPage: 200,
    });
    for (const charge of result.items) {
      items.push({ chargeId: charge.chargeId, chargeName: charge.chargeName });
    }
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage && page <= 10);
  return items;
}
