"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { masterModulePages } from "@/lib/modules/module.types";
import {
  AcctSubledgerFilters,
  type AcctSubledgerFilterValues,
  type AcctSubledgerLedgerOption,
} from "@/features/master/acct-subledger/components/AcctSubledgerFilters";
import { AcctSubledgerTable } from "@/features/master/acct-subledger/components/AcctSubledgerTable";
import { AcctSubledgerForm } from "@/features/master/acct-subledger/components/AcctSubledgerForm";
import {
  createAcctSubledger,
  fetchAcctSubledgerList,
  isAcctSubledgerClientError,
  updateAcctSubledger,
} from "@/features/master/acct-subledger/services/acct-subledger-client";
import {
  fetchAcctLedgerList,
  isAcctLedgerClientError,
} from "@/features/master/acct-ledger/services/acct-ledger-client";
import type {
  AcctSubledger,
  AcctSubledgerCreateInput,
  AcctSubledgerUpdateInput,
  PaginationMeta,
} from "@/features/master/acct-subledger/types/acct-subledger.types";
import { ACCT_SUBLEDGER_DEFAULT_PER_PAGE } from "@/features/master/acct-subledger/types/acct-subledger.types";

const DEFAULT_FILTERS: AcctSubledgerFilterValues = {
  keyword: "",
  ledgerId: "",
  isActive: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: AcctSubledgerFilterValues,
  b: AcctSubledgerFilterValues,
): boolean {
  return (
    a.keyword === b.keyword &&
    a.ledgerId === b.ledgerId &&
    a.isActive === b.isActive
  );
}

export type AcctSubledgerViewProps = {
  embedded?: boolean;
};

export function AcctSubledgerView({
  embedded = false,
}: AcctSubledgerViewProps = {}) {
  const t = useTranslations("master.acctSubledger");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.acctSubledger.toJSON();

  const [filters, setFilters] =
    useState<AcctSubledgerFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AcctSubledgerFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ACCT_SUBLEDGER_DEFAULT_PER_PAGE);
  const [items, setItems] = useState<AcctSubledger[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [ledgers, setLedgers] = useState<AcctSubledgerLedgerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AcctSubledger | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<AcctSubledger | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLedgers() {
      try {
        const result = await fetchAcctLedgerList({
          page: 1,
          perPage: 200,
          isActive: 1,
        });
        if (cancelled) return;
        setLedgers(
          result.items.map((item) => ({
            value: String(item.ledgerId),
            isCash: item.ledgerType === "1",
            label: item.ledgerCode
              ? `${item.ledgerName} (${item.ledgerCode})`
              : item.ledgerName,
          })),
        );
      } catch (err) {
        if (cancelled) return;
        if (isAcctLedgerClientError(err) && err.status === 401) {
          router.replace("/login");
        }
      }
    }

    void loadLedgers();
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
        const ledgerId = Number(appliedFilters.ledgerId);
        const result = await fetchAcctSubledgerList({
          page,
          perPage: pageSize,
          keyword: appliedFilters.keyword.trim() || undefined,
          ledgerId:
            Number.isFinite(ledgerId) && ledgerId > 0 ? ledgerId : undefined,
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
        if (isAcctSubledgerClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isAcctSubledgerClientError(err) ? err.message : tErrors("generic"),
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

  function openEdit(subledger: AcctSubledger) {
    setFormMode("edit");
    setEditing(subledger);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleCreate(input: AcctSubledgerCreateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await createAcctSubledger(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctSubledgerClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(
        isAcctSubledgerClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: AcctSubledgerUpdateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await updateAcctSubledger(input);
      setFormOpen(false);
      setEditing(null);
      setItems((prev) =>
        prev.map((item) =>
          item.subledgId === input.subledgId
            ? {
                ...item,
                subledgName: input.subledgName,
                ledgerId: input.ledgerId,
                isActive:
                  input.isActive !== undefined ? input.isActive : item.isActive,
              }
            : item,
        ),
      );
      setSuccessMessage(t("updateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctSubledgerClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(
        isAcctSubledgerClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus(subledger: AcctSubledger) {
    setStatusConfirmTarget(subledger);
  }

  async function executeToggleStatus(subledger: AcctSubledger) {
    const nextActive = !subledger.isActive;
    setStatusBusyId(subledger.subledgId);
    setSuccessMessage(null);
    try {
      await updateAcctSubledger({
        subledgId: subledger.subledgId,
        subledgName: subledger.subledgName,
        ledgerId: subledger.ledgerId,
        isActive: nextActive,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.subledgId === subledger.subledgId
            ? { ...item, isActive: nextActive }
            : item,
        ),
      );
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctSubledgerClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(true);
      setErrorMessage(
        isAcctSubledgerClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  const body = (
    <>
      <PageToast message={successMessage} />

      <AcctSubledgerFilters
        values={filters}
        ledgers={ledgers}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <AcctSubledgerTable
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
        onToggleStatus={handleToggleStatus}
        headerActions={
          <Button type="button" icon={Plus} onClick={openCreate}>
            {t("add")}
          </Button>
        }
      />

      <AcctSubledgerForm
        open={formOpen}
        mode={formMode}
        subledger={editing}
        ledgers={ledgers}
        saving={saving}
        errorMessage={formError}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={Boolean(statusConfirmTarget)}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={async () => {
          if (!statusConfirmTarget) return;
          const target = statusConfirmTarget;
          setStatusConfirmTarget(null);
          await executeToggleStatus(target);
        }}
        actionType={
          statusConfirmTarget?.isActive ? "deactivate" : "activate"
        }
        itemName={statusConfirmTarget?.subledgName}
        itemType="Account Subledger"
      />
    </>
  );

  if (embedded) {
    return <div className="flex min-w-0 flex-col gap-4 sm:gap-5">{body}</div>;
  }

  return <ModulePageShell page={pageMeta}>{body}</ModulePageShell>;
}
