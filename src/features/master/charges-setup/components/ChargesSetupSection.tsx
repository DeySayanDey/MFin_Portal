"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import type { ApplOption } from "@/features/master/appl-options";
import { fetchApplOptions } from "@/features/master/appl-options";
import { DEPOSIT_CHARGE_TYPE_OPT_GRP_ID } from "../constants";
import type { AcctLedger } from "@/features/master/acct-ledger/types/acct-ledger.types";
import {
  ChargesSetupFilters,
  type ChargesSetupFilterValues,
} from "./ChargesSetupFilters";
import { ChargesSetupForm } from "./ChargesSetupForm";
import { ChargesSetupTable } from "./ChargesSetupTable";
import {
  fetchChargeSetups,
  isChargesSetupClientError,
  saveChargeSetup,
  toggleChargeSetupStatus,
} from "../services/charges-setup-client";
import type {
  ChargeKind,
  ChargeSetup,
  ChargeSetupPagination,
  ChargeSetupSaveInput,
} from "../types/charges-setup.types";

const DEFAULT_FILTERS: ChargesSetupFilterValues = {
  search: "",
  figureCd: "",
  duringCd: "",
  isRefundable: "",
  isActive: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: ChargesSetupFilterValues,
  b: ChargesSetupFilterValues,
): boolean {
  return (
    a.search === b.search &&
    a.figureCd === b.figureCd &&
    a.duringCd === b.duringCd &&
    a.isRefundable === b.isRefundable &&
    a.isActive === b.isActive
  );
}

type ChargesSetupSectionProps = {
  kind: ChargeKind;
  figureOptions: ApplOption[];
  duringOptions: ApplOption[];
  ledgers: AcctLedger[];
};

export function ChargesSetupSection({
  kind,
  figureOptions,
  duringOptions,
  ledgers,
}: ChargesSetupSectionProps) {
  const t = useTranslations("master.chargesSetup");
  const tErrors = useTranslations("errors");

  const [filters, setFilters] =
    useState<ChargesSetupFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ChargesSetupFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [items, setItems] = useState<ChargeSetup[]>([]);
  const [meta, setMeta] = useState<ChargeSetupPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ChargeSetup | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] =
    useState<ChargeSetup | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [actionError, setActionError] = useToastText();
  const [chargeTypeOptions, setChargeTypeOptions] = useState<ApplOption[]>([]);
  const [chargeTypeError, setChargeTypeError] = useState(false);

  useEffect(() => {
    if (!formOpen || kind !== "deposit") return;
    let cancelled = false;
    setChargeTypeOptions([]);
    setChargeTypeError(false);
    void fetchApplOptions(DEPOSIT_CHARGE_TYPE_OPT_GRP_ID).then((options) => {
      if (!cancelled) setChargeTypeOptions(options);
    }).catch(() => {
      if (!cancelled) setChargeTypeError(true);
    });
    return () => { cancelled = true; };
  }, [formOpen, kind]);

  useEffect(() => {
    if (filtersEqual(filters, appliedFilters)) return;
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
        const result = await fetchChargeSetups(kind, {
          page,
          perPage: pageSize,
          search: appliedFilters.search.trim() || undefined,
          figureCd: appliedFilters.figureCd
            ? Number(appliedFilters.figureCd)
            : undefined,
          duringCd: appliedFilters.duringCd
            ? Number(appliedFilters.duringCd)
            : undefined,
          isRefundable:
            kind === "loan" && appliedFilters.isRefundable !== ""
              ? appliedFilters.isRefundable === "1"
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
          isChargesSetupClientError(err) ? err.message : tErrors("generic"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters, kind, page, pageSize, reloadKey, tErrors]);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(row: ChargeSetup) {
    setFormMode("edit");
    setEditing(row);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(input: ChargeSetupSaveInput) {
    setSaving(true);
    setFormError(null);
    try {
      await saveChargeSetup(kind, input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(
        input.chargeId != null ? t("updateSuccess") : t("createSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(
        isChargesSetupClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function executeToggleActive(item: ChargeSetup) {
    const nextActive = !item.isActive;
    setStatusBusyId(item.chargeId);
    setSuccessMessage(null);
    setActionError(null);
    try {
      await toggleChargeSetupStatus(kind, item.chargeId, nextActive);
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(
        isChargesSetupClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageToast message={successMessage} />
      <PageToast message={actionError} tone="error" />

      <ChargesSetupFilters
        kind={kind}
        values={filters}
        figureOptions={figureOptions}
        duringOptions={duringOptions}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <ChargesSetupTable
        kind={kind}
        items={items}
        meta={meta}
        page={page}
        pageSize={pageSize}
        loading={loading}
        error={error}
        errorMessage={errorMessage}
        statusBusyId={statusBusyId}
        figureOptions={figureOptions}
        duringOptions={duringOptions}
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

      <ChargesSetupForm
        open={formOpen}
        mode={formMode}
        kind={kind}
        charge={editing}
        chargeTypeOptions={chargeTypeOptions}
        chargeTypeError={chargeTypeError}
        figureOptions={figureOptions}
        duringOptions={duringOptions}
        ledgers={ledgers}
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
        itemName={statusConfirmTarget?.chargeName}
        itemType={t("confirmItemType")}
      />
    </div>
  );
}
