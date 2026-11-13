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
  StaffFilters,
  type StaffFilterValues,
} from "@/features/master/staff/components/StaffFilters";
import { StaffTable } from "@/features/master/staff/components/StaffTable";
import { StaffForm } from "@/features/master/staff/components/StaffForm";
import {
  createStaff,
  fetchStaffList,
  fetchStaffLookups,
  isStaffClientError,
  updateStaff,
} from "@/features/master/staff/services/staff-client";
import {
  fetchBranch,
  fetchBranchList,
  isBranchClientError,
} from "@/features/master/branch/services/branch-client";
import type { Branch } from "@/features/master/branch/types/branch.types";
import { fetchRoleList, isRoleClientError } from "@/features/master/roles/services/role-client";
import type { Role } from "@/features/master/roles/types/role.types";
import type {
  DesignationOption,
  PaginationMeta,
  Staff,
  StaffCreateInput,
  StaffUpdateInput,
} from "@/features/master/staff/types/staff.types";

const DEFAULT_FILTERS: StaffFilterValues = {
  keyword: "",
  status: "",
  branchId: "",
  designationId: "",
};

const SEARCH_DEBOUNCE_MS = 350;

function filtersEqual(a: StaffFilterValues, b: StaffFilterValues): boolean {
  return (
    a.keyword === b.keyword &&
    a.status === b.status &&
    a.branchId === b.branchId &&
    a.designationId === b.designationId
  );
}

export function StaffView() {
  const t = useTranslations("master.staff");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = masterModulePages.staff.toJSON();

  const [filters, setFilters] = useState<StaffFilterValues>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<StaffFilterValues>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<Staff[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffBranches, setStaffBranches] = useState<Branch[]>([]);
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleLoadError, setRoleLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<Staff | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useToastText();

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      try {
        const [lookupResult, branchResult] = await Promise.all([
          fetchStaffLookups(),
          fetchBranchList({ page: 1, perPage: 200, isActive: 1 }),
        ]);
        if (cancelled) return;
        setDesignations(lookupResult.designations);
        setBranches(branchResult.items);
      } catch (err) {
        if (cancelled) return;
        if (
          (isStaffClientError(err) || isBranchClientError(err)) &&
          err.status === 401
        ) {
          router.replace("/login");
          router.refresh();
        }
      }
    }

    void loadLookups();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!formOpen) return;
    let cancelled = false;
    async function loadRoles() {
      setRoleLoadError(null);
      try {
        const allRoles: Role[] = [];
        let rolePage = 1;
        let hasMore = true;
        while (hasMore) {
          const result = await fetchRoleList({ page: rolePage, perPage: 100 });
          allRoles.push(...result.items);
          hasMore = Boolean(result.meta?.hasMore && result.items.length);
          rolePage += 1;
        }
        if (!cancelled) setRoles(allRoles);
      } catch (err) {
        if (cancelled) return;
        setRoles([]);
        if (isRoleClientError(err) && err.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setRoleLoadError(t("roleLoadError"));
      }
    }
    void loadRoles();
    return () => { cancelled = true; };
  }, [formOpen, router, t]);

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
        const result = await fetchStaffList({
          page,
          perPage: pageSize,
          keyword: appliedFilters.keyword.trim() || undefined,
          status:
            appliedFilters.status === ""
              ? undefined
              : Number(appliedFilters.status),
          branchId:
            appliedFilters.branchId === ""
              ? undefined
              : Number(appliedFilters.branchId),
          designationId:
            appliedFilters.designationId === ""
              ? undefined
              : Number(appliedFilters.designationId),
          includeModules: true,
        });
        if (cancelled) return;
        setItems(result.items);
        setMeta(result.meta);
      } catch (err) {
        if (cancelled) return;
        if (isStaffClientError(err) && err.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setError(true);
        setErrorMessage(
          isStaffClientError(err) ? err.message : tErrors("generic"),
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

  useEffect(() => {
    let cancelled = false;
    const knownIds = new Set(branches.map((branch) => branch.branchId));
    const missingIds = [...new Set(items.flatMap((staff) =>
      staff.branchId != null && !knownIds.has(staff.branchId) ? [staff.branchId] : [],
    ))];

    async function loadStaffBranches() {
      const results = await Promise.allSettled(missingIds.map((id) => fetchBranch(id)));
      if (cancelled) return;
      setStaffBranches(results.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      ));
    }

    void loadStaffBranches();
    return () => { cancelled = true; };
  }, [items, branches]);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(staff: Staff) {
    setFormMode("edit");
    setEditing(staff);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleCreate(input: StaffCreateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await createStaff(input);
      setFormOpen(false);
      setSuccessMessage(t("createSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isStaffClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setFormError(isStaffClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(input: StaffUpdateInput) {
    setSaving(true);
    setFormError(null);
    try {
      await updateStaff(input);
      setFormOpen(false);
      setEditing(null);
      setSuccessMessage(t("updateSuccess"));
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isStaffClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setFormError(isStaffClientError(err) ? err.message : tErrors("generic"));
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus(staff: Staff) {
    setStatusConfirmTarget(staff);
  }

  async function executeToggleStatus(staff: Staff) {
    const nextActive = staff.status !== 1;
    setStatusBusyId(staff.staffId);
    setSuccessMessage(null);
    try {
      await updateStaff({
        staffId: staff.staffId,
        employeeCode: staff.employeeCode,
        fullName: staff.fullName,
        shortName: staff.shortName,
        branchId: staff.branchId,
        designationId: staff.designationId,
        mobile: staff.mobile,
        email: staff.email,
        joinDate: staff.joinDate,
        aadhaar: staff.aadhaar,
        pan: staff.pan,
        deviceId: staff.deviceId,
        moduleIds: staff.moduleAccess.map((item) => item.moduleId),
        status: nextActive ? 1 : 0,
      });
      setSuccessMessage(
        nextActive ? t("activateSuccess") : t("deactivateSuccess"),
      );
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (isStaffClientError(err) && err.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setError(true);
      setErrorMessage(
        isStaffClientError(err) ? err.message : tErrors("generic"),
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />

      <StaffFilters
        values={filters}
        branches={branches}
        designations={designations}
        onChange={setFilters}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setAppliedFilters(DEFAULT_FILTERS);
          setPage(1);
          setSuccessMessage(null);
        }}
      />

      <StaffTable
        items={items}
        branches={[...branches, ...staffBranches]}
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

      <StaffForm
        open={formOpen}
        mode={formMode}
        staff={editing}
        branches={branches}
        designations={designations}
        roles={roles}
        roleLoadError={roleLoadError}
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
          statusConfirmTarget?.status === 1 ? "deactivate" : "activate"
        }
        itemName={
          statusConfirmTarget
            ? `${statusConfirmTarget.fullName} (${statusConfirmTarget.employeeCode})`
            : undefined
        }
        itemType="Staff Member"
      />
    </ModulePageShell>
  );
}
