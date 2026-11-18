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
  AcctHeadFilters,
  type AcctHeadCategoryOption,
  type AcctHeadFilterValues,
} from "@/features/master/acct-head/components/AcctHeadFilters";
import { AcctHeadTable } from "@/features/master/acct-head/components/AcctHeadTable";
import { AcctHeadForm } from "@/features/master/acct-head/components/AcctHeadForm";
import {
  createAcctHead,
  fetchAcctHeadList,
  isAcctHeadClientError,
  updateAcctHead,
} from "@/features/master/acct-head/services/acct-head-client";
import {
  fetchAcctCategoryList,
  isAcctCategoryClientError,
} from "@/features/master/acct-category/services/acct-category-client";
import type {
  AcctHead,
  AcctHeadCreateInput,
  AcctHeadUpdateInput,
  PaginationMeta,
} from "@/features/master/acct-head/types/acct-head.types";
import { ACCT_HEAD_DEFAULT_PER_PAGE } from "@/features/master/acct-head/types/acct-head.types";

const DEFAULT_FILTERS: AcctHeadFilterValues = {
  keyword: "",
  categId: "",
  isActive: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(
  a: AcctHeadFilterValues,
  b: AcctHeadFilterValues,
): boolean {
  return (
    a.keyword === b.keyword &&
    a.categId === b.categId &&
    a.isActive === b.isActive
  );
}

export type AcctHeadViewProps = {
  embedded?: boolean;
};

export function AcctHeadView({ embedded = false }: AcctHeadViewProps = {}) {
  const t = useTranslations("master.acctHead");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.acctHead.toJSON();

  const [filters, setFilters] = useState<AcctHeadFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<AcctHeadFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ACCT_HEAD_DEFAULT_PER_PAGE);
  const [items, setItems] = useState<AcctHead[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<AcctHeadCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AcctHead | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<AcctHead | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const result = await fetchAcctCategoryList({
          page: 1,
          perPage: 200,
        });
        if (cancelled) return;
        setCategories(
          result.items.map((item) => ({
            value: String(item.categId),
            label: item.categCode
              ? `${item.categName} (${item.categCode})`
              : item.categName,
          })),
        );
      } catch (err) {
        if (cancelled) return;
        if (isAcctCategoryClientError(err) && err.status === 401) {
          router.replace("/login");
        }
      }
    }

    void loadCategories();
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
        const categId = Number(appliedFilters.categId);
        const result = await fetchAcctHeadList({
          page,
          perPage: pageSize,
          keyword: appliedFilters.keyword.trim() || undefined,
          categId:
            Number.isFinite(categId) && categId > 0 ? categId : undefined,
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
        if (isAcctHeadClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        setErrorMessage(
          isAcctHeadClientError(err) ? err.message : tErrors("generic"),
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

  function openEdit(head: AcctHead) {
    setFormMode("edit");
    setEditing(head);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleCreate(input: AcctHeadCreateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await createAcctHead(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctHeadClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(
        isAcctHeadClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: AcctHeadUpdateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await updateAcctHead(input);
      setFormOpen(false);
      setEditing(null);
      setItems((prev) =>
        prev.map((item) =>
          item.mainhdId === input.mainhdId
            ? {
                ...item,
                mainhdName: input.mainhdName,
                categId: input.categId,
                isActive:
                  input.isActive !== undefined ? input.isActive : item.isActive,
              }
            : item,
        ),
      );
      setSuccessMessage(t("updateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctHeadClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(
        isAcctHeadClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus(head: AcctHead) {
    setStatusConfirmTarget(head);
  }

  async function executeToggleStatus(head: AcctHead) {
    const nextActive = !head.isActive;
    setStatusBusyId(head.mainhdId);
    setSuccessMessage(null);
    try {
      await updateAcctHead({
        mainhdId: head.mainhdId,
        mainhdName: head.mainhdName,
        categId: head.categId,
        isActive: nextActive,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.mainhdId === head.mainhdId
            ? { ...item, isActive: nextActive }
            : item,
        ),
      );
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isAcctHeadClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(true);
      setErrorMessage(
        isAcctHeadClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  const body = (
    <>
      <PageToast message={successMessage} />

      <AcctHeadFilters
        values={filters}
        categories={categories}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <AcctHeadTable
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

      <AcctHeadForm
        open={formOpen}
        mode={formMode}
        head={editing}
        categories={categories}
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
        itemName={statusConfirmTarget?.mainhdName}
        itemType="Account Head"
      />
    </>
  );

  if (embedded) {
    return <div className="flex min-w-0 flex-col gap-4 sm:gap-5">{body}</div>;
  }

  return <ModulePageShell page={pageMeta}>{body}</ModulePageShell>;
}
