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
  AcctSubledgerBranchFilters,
  type AcctSubledgerBranchFilterValues,
  type SelectOption,
} from "@/features/master/acct-subledger-branch/components/AcctSubledgerBranchFilters";
import { AcctSubledgerBranchTable } from "@/features/master/acct-subledger-branch/components/AcctSubledgerBranchTable";
import { AcctSubledgerBranchForm } from "@/features/master/acct-subledger-branch/components/AcctSubledgerBranchForm";
import {
  createAcctSubledgerBranch,
  fetchAcctSubledgerBranchList,
  isAcctSubledgerBranchClientError,
  updateAcctSubledgerBranch,
} from "@/features/master/acct-subledger-branch/services/acct-subledger-branch-client";
import {
  fetchAcctSubledgerList,
  isAcctSubledgerClientError,
} from "@/features/master/acct-subledger/services/acct-subledger-client";
import {
  fetchBranchList,
  isBranchClientError,
} from "@/features/master/branch/services/branch-client";
import type {
  AcctSubledgerBranch,
  AcctSubledgerBranchCreateInput,
  AcctSubledgerBranchUpdateInput,
  PaginationMeta,
} from "@/features/master/acct-subledger-branch/types/acct-subledger-branch.types";
import { ACCT_SUBLEDGER_BRANCH_DEFAULT_PER_PAGE } from "@/features/master/acct-subledger-branch/types/acct-subledger-branch.types";

const DEFAULT_FILTERS: AcctSubledgerBranchFilterValues = {
  subledgId: "",
  branchId: "",
  isActive: "",
};

const FILTER_DEBOUNCE_MS = 350;

function filtersEqual(
  a: AcctSubledgerBranchFilterValues,
  b: AcctSubledgerBranchFilterValues,
): boolean {
  return (
    a.subledgId === b.subledgId &&
    a.branchId === b.branchId &&
    a.isActive === b.isActive
  );
}

export type AcctSubledgerBranchViewProps = {
  embedded?: boolean;
};

export function AcctSubledgerBranchView({
  embedded = false,
}: AcctSubledgerBranchViewProps = {}) {
  const t = useTranslations("master.acctSubledgerBranch");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.acctSubledgerBranch.toJSON();

  const [filters, setFilters] =
    useState<AcctSubledgerBranchFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AcctSubledgerBranchFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    ACCT_SUBLEDGER_BRANCH_DEFAULT_PER_PAGE,
  );
  const [items, setItems] = useState<AcctSubledgerBranch[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [subledgers, setSubledgers] = useState<SelectOption[]>([]);
  const [branches, setBranches] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AcctSubledgerBranch | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<AcctSubledgerBranch | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [subResult, branchResult] = await Promise.all([
          fetchAcctSubledgerList({ page: 1, perPage: 200, isActive: 1 }),
          fetchBranchList({ page: 1, perPage: 200, isActive: 1 }),
        ]);
        if (cancelled) return;
        setSubledgers(
          subResult.items.map((item) => ({
            value: String(item.subledgId),
            label: item.subledgCode
              ? `${item.subledgName} (${item.subledgCode})`
              : item.subledgName,
          })),
        );
        setBranches(
          branchResult.items.map((item) => ({
            value: String(item.branchId),
            label: item.branchCode
              ? `${item.branchName} (${item.branchCode})`
              : item.branchName,
          })),
        );
      } catch (err) {
        if (cancelled) return;
        const unauthorized =
          (isAcctSubledgerClientError(err) && err.status === 401) ||
          (isBranchClientError(err) && err.status === 401);
        if (unauthorized) router.replace("/login");
      }
    }

    void loadLookups();
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
    }, FILTER_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters, appliedFilters]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const subledgId = Number(appliedFilters.subledgId);
        const branchId = Number(appliedFilters.branchId);
        const result = await fetchAcctSubledgerBranchList({
          page,
          perPage: pageSize,
          subledgId:
            Number.isFinite(subledgId) && subledgId > 0 ? subledgId : undefined,
          branchId:
            Number.isFinite(branchId) && branchId > 0 ? branchId : undefined,
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
        if (isAcctSubledgerBranchClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isAcctSubledgerBranchClientError(err)
            ? err.message
            : tErrors("generic"),
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

  function openEdit(mapping: AcctSubledgerBranch) {
    setFormMode("edit");
    setEditing(mapping);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleCreate(input: AcctSubledgerBranchCreateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await createAcctSubledgerBranch(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctSubledgerBranchClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(
        isAcctSubledgerBranchClientError(err)
          ? err.message
          : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: AcctSubledgerBranchUpdateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await updateAcctSubledgerBranch(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(t("updateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctSubledgerBranchClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(
        isAcctSubledgerBranchClientError(err)
          ? err.message
          : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus(mapping: AcctSubledgerBranch) {
    setStatusConfirmTarget(mapping);
  }

  async function executeToggleStatus(mapping: AcctSubledgerBranch) {
    const nextActive = !mapping.isActive;
    setStatusBusyId(mapping.id);
    setSuccessMessage(null);
    try {
      await updateAcctSubledgerBranch({
        id: mapping.id,
        branchId: mapping.branchId,
        subledgId: mapping.subledgId,
        isActive: nextActive,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === mapping.id ? { ...item, isActive: nextActive } : item,
        ),
      );
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctSubledgerBranchClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(true);
      setErrorMessage(
        isAcctSubledgerBranchClientError(err)
          ? err.message
          : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  const body = (
    <>
      <PageToast message={successMessage} />

      <AcctSubledgerBranchFilters
        values={filters}
        subledgers={subledgers}
        branches={branches}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <AcctSubledgerBranchTable
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

      <AcctSubledgerBranchForm
        open={formOpen}
        mode={formMode}
        mapping={editing}
        subledgers={subledgers}
        branches={branches}
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
        itemName={
          statusConfirmTarget
            ? `${statusConfirmTarget.subledgName} (${statusConfirmTarget.branchName})`
            : undefined
        }
        itemType="Subledger Branch Mapping"
      />
    </>
  );

  if (embedded) {
    return <div className="flex min-w-0 flex-col gap-4 sm:gap-5">{body}</div>;
  }

  return <ModulePageShell page={pageMeta}>{body}</ModulePageShell>;
}
