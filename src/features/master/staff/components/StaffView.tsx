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
  fetchBranchList,
  isBranchClientError,
} from "@/features/master/branch/services/branch-client";
import type { Branch } from "@/features/master/branch/types/branch.types";
import type {
  DesignationOption,
  ModuleAccessOption,
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
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [modules, setModules] = useState<ModuleAccessOption[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setModules(lookupResult.modules);
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

  async function handleToggleStatus(staff: Staff) {
    const nextActive = staff.status !== 1;
    setStatusBusyId(staff.staffId);
    setSuccessMessage(null);
    try {
      await updateStaff({
        staffId: staff.staffId,
        employeeCode: staff.employeeCode,
        fullName: staff.fullName,
        branchId: staff.branchId,
        designationId: staff.designationId,
        mobile: staff.mobile,
        email: staff.email,
        joinDate: staff.joinDate,
        aadhaar: staff.aadhaar,
        pan: staff.pan,
        monthlySalary: staff.monthlySalary,
        collectionTarget: staff.collectionTarget,
        assignment: staff.assignment,
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

      <StaffForm
        open={formOpen}
        mode={formMode}
        staff={editing}
        branches={branches}
        designations={designations}
        modules={modules}
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
