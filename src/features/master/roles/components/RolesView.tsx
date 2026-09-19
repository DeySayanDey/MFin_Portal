"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { masterModulePages } from "@/lib/modules/module.types";
import {
  RolesFilters,
  type RoleFilterValues,
} from "@/features/master/roles/components/RolesFilters";
import { RolesTable } from "@/features/master/roles/components/RolesTable";
import { RolesForm } from "@/features/master/roles/components/RolesForm";
import {
  createRole,
  fetchRoleList,
  isRoleClientError,
  updateRole,
} from "@/features/master/roles/services/role-client";
import type {
  PaginationMeta,
  Role,
  RoleCreateInput,
  RoleUpdateInput,
} from "@/features/master/roles/types/role.types";

const DEFAULT_FILTERS: RoleFilterValues = {
  keyword: "",
  status: "",
  isAdmin: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(a: RoleFilterValues, b: RoleFilterValues): boolean {
  return (
    a.keyword === b.keyword &&
    a.status === b.status &&
    a.isAdmin === b.isAdmin
  );
}

export function RolesView() {
  const t = useTranslations("master.roles");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.roles.toJSON();

  const [filters, setFilters] = useState<RoleFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<RoleFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<Role[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        const result = await fetchRoleList({
          page,
          perPage: pageSize,
          keyword: appliedFilters.keyword.trim() || undefined,
          status:
            appliedFilters.status === ""
              ? undefined
              : Number(appliedFilters.status),
          isAdmin:
            appliedFilters.isAdmin === ""
              ? undefined
              : Number(appliedFilters.isAdmin),
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (cancelled) return;
        if (isRoleClientError(err) && err.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setError(true);
        setErrorMessage(
          isRoleClientError(err) ? err.message : tErrors("generic"),
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

  function openEdit(role: Role) {
    setFormMode("edit");
    setEditing(role);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleCreate(input: RoleCreateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await createRole(input);
      setFormOpen(false);
      setSuccessMessage(t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isRoleClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setFormError(isRoleClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: RoleUpdateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await updateRole(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(t("updateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isRoleClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setFormError(isRoleClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(role: Role) {
    const nextActive = role.status !== 1;
    setStatusBusyId(role.id);
    setSuccessMessage(null);
    try {
      await updateRole({
        roleId: role.id,
        roleName: role.roleName,
        isAdmin: role.isAdmin,
        status: nextActive ? 1 : 0,
      });
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isRoleClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setError(true);
      setErrorMessage(
        isRoleClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <ModulePageShell
      page={pageMeta}
      actions={
        <Button type="button" icon={Plus} onClick={openCreate}>
          {t("add")}
        </Button>
      }
    >
      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      <RolesFilters
        values={filters}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <RolesTable
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
      />

      <RolesForm
        open={formOpen}
        mode={formMode}
        role={editing}
        saving={saving}
        errorMessage={formError}
        onClose={() => {
          if (saving) return;
          setFormOpen(false);
          setFormError(null);
        }}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
    </ModulePageShell>
  );
}
