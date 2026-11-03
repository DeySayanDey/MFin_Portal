"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Banknote, Plus } from "lucide-react";
import { DataPage } from "@/components/shared/DataPage";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { masterModulePages } from "@/lib/modules/module.types";

import { DepositSchemeSetupTable } from "./DepositSchemeSetupTable";
import { DepositSchemeSetupForm } from "./DepositSchemeSetupForm";
import {
  DepositSchemeSetupFilters,
  type DepositSchemeSetupFilterValues,
} from "./DepositSchemeSetupFilters";

import { DepositSchemeChargesTable } from "./DepositSchemeChargesTable";
import { DepositSchemeChargesForm } from "./DepositSchemeChargesForm";
import {
  DepositSchemeChargesFilters,
  type DepositSchemeChargesFilterValues,
} from "./DepositSchemeChargesFilters";

import {
  fetchDepositSchemeSetups,
  saveDepositSchemeSetup,
  toggleDepositSchemeStatus,
  fetchDepositSchemeCharges,
  saveDepositSchemeCharge,
  toggleDepositSchemeChargeStatus,
  getAllDepositSchemeSetups,
  isDepositSchemesClientError,
} from "../services/deposit-schemes-client";
import { fetchChargeSetups } from "@/features/master/charges-setup/services/charges-setup-client";

import type {
  DepositSchemeSetup,
  DepositSchemeCharge,
  DepositSchemeSetupSaveInput,
  DepositSchemeChargeSaveInput,
  PaginationMeta,
} from "../types/deposit-schemes.types";

type PanelId = "setup" | "charges";

const TAB_IDS: PanelId[] = ["setup", "charges"];
const SEARCH_DEBOUNCE_MS = 350;

function normalizeTab(value: string | null | undefined): PanelId | null {
  if (!value) return null;
  if (TAB_IDS.includes(value as PanelId)) return value as PanelId;
  return null;
}

const DEFAULT_SETUP_FILTERS: DepositSchemeSetupFilterValues = {
  search: "",
  depositTypeCd: "",
  isActive: "",
};

const DEFAULT_CHARGES_FILTERS: DepositSchemeChargesFilterValues = {
  schemeId: "",
  chargesId: "",
  isActive: "",
};

function setupFiltersEqual(
  a: DepositSchemeSetupFilterValues,
  b: DepositSchemeSetupFilterValues,
): boolean {
  return (
    a.search === b.search &&
    a.depositTypeCd === b.depositTypeCd &&
    a.isActive === b.isActive
  );
}

function chargesFiltersEqual(
  a: DepositSchemeChargesFilterValues,
  b: DepositSchemeChargesFilterValues,
): boolean {
  return (
    a.schemeId === b.schemeId &&
    a.chargesId === b.chargesId &&
    a.isActive === b.isActive
  );
}

export function DepositSchemesView({
  initialTab = "setup",
}: {
  initialTab?: string;
}) {
  const t = useTranslations("master.depositSchemes");
  const pageMeta = masterModulePages.depositSchemes.toJSON();

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
  const t = useTranslations("master.depositSchemes.setup");
  const tGlobal = useTranslations("master.depositSchemes");
  const tErrors = useTranslations("errors");

  const [filters, setFilters] =
    useState<DepositSchemeSetupFilterValues>(DEFAULT_SETUP_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<DepositSchemeSetupFilterValues>(DEFAULT_SETUP_FILTERS);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<DepositSchemeSetup[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<DepositSchemeSetup | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<DepositSchemeSetup | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

  useEffect(() => {
    if (setupFiltersEqual(filters, appliedFilters)) return;
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
        const result = await fetchDepositSchemeSetups({
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
          depositTypeCd: appliedFilters.depositTypeCd
            ? Number(appliedFilters.depositTypeCd)
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
          isDepositSchemesClientError(err) ? err.message : tErrors("generic"),
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

  function openEdit(item: DepositSchemeSetup) {
    setFormMode("edit");
    setEditing(item);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(input: DepositSchemeSetupSaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveDepositSchemeSetup(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(input.schemeId ? t("updateSuccess") : t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(
        isDepositSchemesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(item: DepositSchemeSetup) {
    const nextActive = !item.isActive;
    setStatusBusyId(item.id);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await toggleDepositSchemeStatus(item.id, nextActive);
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(
        isDepositSchemesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <>
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <DepositSchemeSetupFilters
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_SETUP_FILTERS);
          setAppliedFilters(DEFAULT_SETUP_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <DepositSchemeSetupTable
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

      <DepositSchemeSetupForm
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
  const t = useTranslations("master.depositSchemes.charges");
  const tGlobal = useTranslations("master.depositSchemes");
  const tErrors = useTranslations("errors");

  const [filters, setFilters] =
    useState<DepositSchemeChargesFilterValues>(DEFAULT_CHARGES_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<DepositSchemeChargesFilterValues>(DEFAULT_CHARGES_FILTERS);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<DepositSchemeCharge[]>([]);
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
  const [editing, setEditing] = useState<DepositSchemeCharge | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<DepositSchemeCharge | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();

  useEffect(() => {
    let cancelled = false;
    async function loadAuxiliaryOptions() {
      try {
        const [schemes, charges] = await Promise.all([
          getAllDepositSchemeSetups(),
          loadActiveMasterCharges(),
        ]);
        if (!cancelled) {
          setAvailableSchemes(schemes);
          setMasterCharges(charges);
        }
      } catch {
        // keep fallback
      }
    }
    void loadAuxiliaryOptions();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (chargesFiltersEqual(filters, appliedFilters)) return;
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
        const collected: DepositSchemeCharge[] = [];
        let pageNo = 1;
        let lastPage = 1;
        do {
          const result = await fetchDepositSchemeCharges({
            page: pageNo,
            perPage: 200,
            schemeId: appliedFilters.schemeId
              ? Number(appliedFilters.schemeId)
              : undefined,
            chargesId: appliedFilters.chargesId
              ? Number(appliedFilters.chargesId)
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
          isDepositSchemesClientError(err) ? err.message : tErrors("generic"),
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

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(item: DepositSchemeCharge) {
    setFormMode("edit");
    setEditing(item);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(input: DepositSchemeChargeSaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      const result = await saveDepositSchemeCharge(input);
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
        isDepositSchemesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(item: DepositSchemeCharge) {
    const nextActive = !item.isActive;
    setStatusBusyId(item.id);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await toggleDepositSchemeChargeStatus(item.id, nextActive);
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(
        isDepositSchemesClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <>
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <DepositSchemeChargesFilters
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

      <DepositSchemeChargesTable
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
        onEdit={openEdit}
        onToggleActive={setStatusConfirmTarget}
        headerActions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("add")}
          </Button>
        }
      />

      <DepositSchemeChargesForm
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
    const result = await fetchChargeSetups("deposit", {
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
