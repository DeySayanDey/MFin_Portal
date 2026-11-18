"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { showToast } from "@/components/ui/toast";
import { useRouter } from "@/i18n/navigation";
import { getStoredAuthUser } from "@/features/auth/utils/auth-user-storage";
import { onboardingModulePages } from "@/lib/modules/module.types";
import {
  fetchGroups,
  fetchGroupById,
  isGroupClientError,
  saveGroup,
  updateGroupStatus,
} from "../services/group-client";
import type {
  Group,
  GroupFilterValues,
  GroupListResult,
  GroupSaveInput,
  GroupStatus,
} from "../types/group.types";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { fetchCenterList } from "@/features/master/center/services/center-client";
import { fetchStaffList } from "@/features/master/staff/services/staff-client";
import { fetchStates } from "@/features/master/organization/services/organization-client";
import { fetchApplOptions } from "@/features/master/appl-options/services/appl-options-client";
import type { Branch } from "@/features/master/branch/types/branch.types";
import type { Center } from "@/features/master/center/types/center.types";
import type { State } from "@/features/master/organization/types/organization.types";
import type { Staff } from "@/features/master/staff/types/staff.types";
import type { ApplOption } from "@/features/master/appl-options/types/appl-options.types";
import { GroupManagementFilters } from "./GroupManagementFilters";
import { GroupManagementTable } from "./GroupManagementTable";
import { GroupManagementDrawer } from "./GroupManagementDrawer";
import { GroupManagementForm, type GroupFormState } from "./GroupManagementForm";
import { GroupStatusConfirmDialog } from "./GroupStatusConfirmDialog";
import { GroupKycModal } from "@/features/onboarding/group-kyc";

const DEFAULT_FILTERS: GroupFilterValues = {
  keyword: "",
  branchId: "",
  centerId: "",
  groupTypeCd: "",
  foId: "",
  statusCd: "",
};

function updateUrlQuery(params: Record<string, string | number | undefined | null>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const [key, val] of Object.entries(params)) {
    if (val != null && val !== "") {
      url.searchParams.set(key, String(val));
    } else {
      url.searchParams.delete(key);
    }
  }
  window.history.replaceState(null, "", url.toString());
}

function mapServerErrorsToFields(
  message: string,
  details: unknown,
): Partial<Record<keyof GroupFormState, string>> {
  const result: Partial<Record<keyof GroupFormState, string>> = {};
  const fieldMap: Record<string, keyof GroupFormState> = {
    group_name: "groupName",
    groupName: "groupName",
    branch_id: "branchId",
    branchId: "branchId",
    group_type_cd: "groupTypeCd",
    groupTypeCd: "groupTypeCd",
    ref_code: "refCode",
    refCode: "refCode",
    registration_no: "registrationNo",
    registrationNo: "registrationNo",
    member_no: "memberNo",
    memberNo: "memberNo",
    center_id: "centerId",
    centerId: "centerId",
    fo_id: "foId",
    foId: "foId",
    pin_code: "pinCode",
    pinCode: "pinCode",
    ifsc_code: "ifscCode",
    ifscCode: "ifscCode",
    bank_account_no: "bankAccountNo",
    bankAccountNo: "bankAccountNo",
    president_member_id: "presidentMemberId",
    secretary_member_id: "secretaryMemberId",
    treasurer_member_id: "treasurerMemberId",
  };

  if (details && typeof details === "object") {
    const record = details as Record<string, unknown>;
    const errors =
      record.fieldErrors && typeof record.fieldErrors === "object"
        ? (record.fieldErrors as Record<string, unknown>)
        : record;
    for (const [key, value] of Object.entries(errors)) {
      const fieldName = fieldMap[key];
      const first = Array.isArray(value) ? value[0] : value;
      if (fieldName && typeof first === "string") result[fieldName] = first;
    }
  }

  const lower = message.toLowerCase();
  if (lower.includes("group name") && !result.groupName) {
    result.groupName = message;
  } else if ((lower.includes("reference code") || lower.includes("ref code")) && !result.refCode) {
    result.refCode = message;
  } else if (lower.includes("registration number") && !result.registrationNo) {
    result.registrationNo = message;
  } else if (lower.includes("number of members") && !result.memberNo) {
    result.memberNo = message;
  } else if (lower.includes("field officer") && !result.foId) {
    result.foId = message;
  } else if (lower.includes("center") && !result.centerId) {
    result.centerId = message;
  } else if (lower.includes("branch") && !result.branchId) {
    result.branchId = message;
  } else if (lower.includes("pin") && !result.pinCode) {
    result.pinCode = message;
  } else if (lower.includes("ifsc") && !result.ifscCode) {
    result.ifscCode = message;
  } else if (lower.includes("bank account") && !result.bankAccountNo) {
    result.bankAccountNo = message;
  } else if (lower.includes("president") || lower.includes("secretary") || lower.includes("treasurer")) {
    result.presidentMemberId = result.presidentMemberId ?? message;
  }

  return result;
}

export function GroupManagementView() {
  const router = useRouter();
  const pageMeta = useMemo(() => onboardingModulePages.groupManagement.toJSON(), []);
  const [user, setUser] = useState<ReturnType<typeof getStoredAuthUser>>(null);
  const [initialized, setInitialized] = useState(false);
  const isBranchBound = Boolean(user && !user.isHead && !user.isAdmin && user.branchId);

  const [filters, setFilters] = useState<GroupFilterValues>(DEFAULT_FILTERS);
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Data state
  const [items, setItems] = useState<Group[]>([]);
  const [meta, setMeta] = useState<GroupListResult["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  // Lookups data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [groupTypes, setGroupTypes] = useState<ApplOption[]>([]);
  const [genderOptions, setGenderOptions] = useState<ApplOption[]>([]);
  const [frequencyOptions, setFrequencyOptions] = useState<ApplOption[]>([]);
  const [dayOptions, setDayOptions] = useState<ApplOption[]>([]);

  // Modals & Drawers state
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
  const [kycGroup, setKycGroup] = useState<Group | null>(null);
  const [statusDialogTarget, setStatusDialogTarget] = useState<Group | null>(null);
  const [statusDialogNext, setStatusDialogNext] = useState<GroupStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Partial<Record<keyof GroupFormState, string>>
  >({});
  const [successMessage, setSuccessMessage] = useToastText();

  useEffect(() => {
    const storedUser = getStoredAuthUser();
    const params = new URLSearchParams(window.location.search);
    const branchBound = Boolean(storedUser && !storedUser.isHead && !storedUser.isAdmin && storedUser.branchId);
    const keyword = params.get("keyword") || "";
    const initialPage = Number(params.get("page"));
    const initialPageSize = Number(params.get("per_page"));

    setUser(storedUser);
    setFilters({
      keyword,
      branchId: branchBound && storedUser?.branchId ? String(storedUser.branchId) : params.get("branch_id") || "",
      centerId: params.get("center_id") || "",
      groupTypeCd: params.get("group_type_cd") || "",
      foId: params.get("fo_id") || "",
      statusCd: params.get("status_cd") || "",
    });
    setDebouncedKeyword(keyword.trim());
    setPage(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
    setPageSize([10, 20, 50, 100].includes(initialPageSize) ? initialPageSize : 50);
    setInitialized(true);
  }, []);

  // Search debounce (350ms)
  useEffect(() => {
    if (!initialized || filters.keyword.trim() === debouncedKeyword) return;
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(filters.keyword.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.keyword, debouncedKeyword, initialized]);

  // Sync state to URL search parameters
  useEffect(() => {
    if (!initialized) return;
    updateUrlQuery({
      keyword: debouncedKeyword || null,
      branch_id: filters.branchId || null,
      center_id: filters.centerId || null,
      group_type_cd: filters.groupTypeCd || null,
      fo_id: filters.foId || null,
      status_cd: filters.statusCd || null,
      page: page > 1 ? page : null,
      per_page: pageSize !== 50 ? pageSize : null,
    });
  }, [debouncedKeyword, filters, page, pageSize, initialized]);

  // Load auxiliary lookups once on mount
  useEffect(() => {
    let cancelled = false;
    async function loadAux() {
      try {
        const [branchRes, stateRes, types, genders, freqs, days] = await Promise.all([
          fetchBranchList({ page: 1, perPage: 200, isActive: 1 }),
          fetchStates({ perPage: 200 }),
          fetchApplOptions(24),
          fetchApplOptions(25),
          fetchApplOptions(26),
          fetchApplOptions(2),
        ]);
        if (!cancelled) {
          setBranches(branchRes.items);
          setStates(stateRes.items);
          setGroupTypes(types);
          setGenderOptions(genders);
          setFrequencyOptions(freqs);
          setDayOptions(days);
        }
      } catch (err) {
        if (!cancelled) {
          showToast("Failed to load reference lookups", "error");
        }
      }
    }
    void loadAux();
    return () => {
      cancelled = true;
    };
  }, []);

  // When branch filter changes, reload centers and staff
  useEffect(() => {
    const branchIdNum = Number(filters.branchId);
    setCenters([]);
    setStaff([]);
    if (!branchIdNum) {
      return;
    }
    let cancelled = false;
    async function loadBranchDetails() {
      try {
        const [centersRes, staffRes] = await Promise.all([
          fetchCenterList({ page: 1, perPage: 200, branchId: branchIdNum, isActive: 1 }),
          fetchStaffList({ page: 1, perPage: 200, branchId: branchIdNum, status: 1 }),
        ]);
        if (!cancelled) {
          setCenters(centersRes.items);
          setStaff(staffRes.items);
        }
      } catch {
        if (!cancelled) {
          setCenters([]);
          setStaff([]);
        }
      }
    }
    void loadBranchDetails();
    return () => {
      cancelled = true;
    };
  }, [filters.branchId]);

  // One group list request. Status cards are counted from that result.
  useEffect(() => {
    if (!initialized) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setErrorMessage(undefined);

    async function loadData() {
      try {
        const result = await fetchGroups({
          page,
          perPage: pageSize,
          keyword: debouncedKeyword || undefined,
          branchId: filters.branchId ? Number(filters.branchId) : undefined,
          centerId: filters.centerId ? Number(filters.centerId) : undefined,
          foId: filters.foId ? Number(filters.foId) : undefined,
          groupTypeCd: filters.groupTypeCd ? Number(filters.groupTypeCd) : undefined,
          statusCd: filters.statusCd ? (Number(filters.statusCd) as GroupStatus) : undefined,
        });
        if (!cancelled) {
          setItems(result.items);
          setMeta(result.meta);
        }
      } catch (err) {
        if (!cancelled) {
          if (isGroupClientError(err) && err.status === 401) {
            router.replace("/login");
            return;
          }
          setError(true);
          const msg = isGroupClientError(err) ? err.message : "Unable to load groups";
          setErrorMessage(msg);
          showToast(msg, "error");
          setItems([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    pageSize,
    debouncedKeyword,
    filters.branchId,
    filters.centerId,
    filters.foId,
    filters.groupTypeCd,
    filters.statusCd,
    reloadKey,
    router,
    initialized,
  ]);

  // Handlers
  function handleFilterReset() {
    setFilters({
      keyword: "",
      branchId: isBranchBound && user?.branchId ? String(user.branchId) : "",
      centerId: "",
      groupTypeCd: "",
      foId: "",
      statusCd: "",
    });
    setDebouncedKeyword("");
    setPage(1);
    setSuccessMessage(null);
  }

  function handleOpenCreate() {
    setEditingGroup(null);
    setServerFieldErrors({});
    setFormOpen(true);
  }

  async function handleOpenEdit(group: Group) {
    setEditingGroup(group);
    setServerFieldErrors({});
    setFormOpen(true);
    try {
      const fresh = await fetchGroupById(group.groupId);
      if (fresh) setEditingGroup(fresh);
    } catch {
      // Keep current row data if fetch fails
    }
  }

  async function handleView(group: Group) {
    setViewingGroup(group);
    try {
      const fresh = await fetchGroupById(group.groupId);
      if (fresh) setViewingGroup(fresh);
    } catch {
      // Keep current row data if fetch fails
    }
  }

  function handleRequestStatus(group: Group, nextStatus: GroupStatus) {
    setStatusDialogTarget(group);
    setStatusDialogNext(nextStatus);
  }

  async function handleExecuteStatusChange() {
    if (!statusDialogTarget || statusDialogNext == null) return;
    const target = statusDialogTarget;
    const nextStatus = statusDialogNext;
    setStatusDialogTarget(null);
    setStatusDialogNext(null);

    try {
      await updateGroupStatus(target.groupId, nextStatus);
      const statusNames: Record<GroupStatus, string> = {
        1: "Active",
        2: "Inactive",
        3: "Suspended",
        4: "Closed",
      };
      const msg = `Group status changed to ${statusNames[nextStatus]}`;
      setSuccessMessage(msg);
      showToast(msg, "success");
      setReloadKey((k) => k + 1);

      if (viewingGroup && viewingGroup.groupId === target.groupId) {
        setViewingGroup((prev) =>
          prev
            ? {
              ...prev,
              statusCd: nextStatus,
              statusDesc: statusNames[nextStatus],
              isActive: nextStatus === 1,
            }
            : null,
        );
      }
    } catch (err) {
      if (isGroupClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      const msg = isGroupClientError(err) ? err.message : "Unable to change group status";
      showToast(msg, "error");
    }
  }

  async function handleFormSubmit(input: GroupSaveInput) {
    setSaving(true);
    setServerFieldErrors({});
    try {
      await saveGroup(input);
      const msg = editingGroup ? "Group updated successfully" : "Group created successfully";
      setSuccessMessage(msg);
      showToast(msg, "success");
      setFormOpen(false);
      setEditingGroup(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (isGroupClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      const msg = isGroupClientError(err) ? err.message : "Unable to save group";
      showToast(msg, "error");
      if (isGroupClientError(err)) {
        const mapped = mapServerErrorsToFields(err.message, err.details);
        setServerFieldErrors(mapped);
      }
    } finally {
      setSaving(false);
    }
  }

  const hasFiltersApplied = Boolean(
    debouncedKeyword ||
    filters.branchId ||
    filters.centerId ||
    filters.groupTypeCd ||
    filters.foId ||
    filters.statusCd,
  );

  const total = meta?.total ?? items.length;
  const coversAll = items.length >= total;
  const activeCount = coversAll
    ? items.filter((group) => group.statusCd === 1).length
    : filters.statusCd === "1"
      ? total
      : null;
  const inactiveCount = coversAll
    ? items.filter((group) => group.statusCd === 2).length
    : filters.statusCd === "2"
      ? total
      : null;
  const suspendedClosedCount = coversAll
    ? items.filter((group) => group.statusCd === 3 || group.statusCd === 4).length
    : filters.statusCd === "3" || filters.statusCd === "4"
      ? total
      : null;

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />

      {/* Stat Summary Cards (Exact Branch Directory pattern) */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label="TOTAL GROUPS"
          value={String(total)}
          tone="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="ACTIVE"
          value={loading ? "…" : activeCount == null ? "—" : String(activeCount)}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="INACTIVE"
          value={loading ? "…" : inactiveCount == null ? "—" : String(inactiveCount)}
          tone="bg-slate-100 text-slate-700"
        />
        <StatCard
          label="SUSPENDED / CLOSED"
          value={loading ? "…" : suspendedClosedCount == null ? "—" : String(suspendedClosedCount)}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <GroupManagementFilters
        values={filters}
        branches={branches}
        centers={centers}
        staff={staff}
        groupTypeOptions={groupTypes}
        isBranchBound={isBranchBound}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onReset={handleFilterReset}
      />

      {/* Error notification banner if any */}
      {errorMessage && items.length > 0 ? (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            className="cursor-pointer font-bold underline"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Main Groups Directory Table */}
      <GroupManagementTable
        items={items}
        meta={meta}
        page={page}
        pageSize={pageSize}
        loading={loading}
        error={error}
        errorMessage={errorMessage}
        hasFiltersApplied={hasFiltersApplied}
        onRetry={() => setReloadKey((k) => k + 1)}
        onPageChange={setPage}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
        onView={handleView}
        onEdit={handleOpenEdit}
        onOpenKyc={setKycGroup}
        onRequestStatusChange={handleRequestStatus}
        onResetFilters={handleFilterReset}
        onCreateNew={handleOpenCreate}
        headerActions={
          <Button
            type="button"
            icon={Plus}
            onClick={handleOpenCreate}
          >
            New Group
          </Button>
        }
      />

      <GroupKycModal group={kycGroup} onClose={() => setKycGroup(null)} />

      {/* View Drawer (Read-only) */}
      {viewingGroup ? (
        <GroupManagementDrawer
          group={viewingGroup}
          onClose={() => setViewingGroup(null)}
          onEdit={(grp) => {
            setViewingGroup(null);
            handleOpenEdit(grp);
          }}
          onRequestStatusChange={handleRequestStatus}
        />
      ) : null}

      {/* Add / Edit Form Modal */}
      {formOpen ? (
        <GroupManagementForm
          open={formOpen}
          editing={editingGroup}
          saving={saving}
          branches={branches}
          centers={centers}
          staff={staff}
          states={states}
          typeOptions={groupTypes}
          genderOptions={genderOptions}
          frequencyOptions={frequencyOptions}
          dayOptions={dayOptions}
          isBranchBound={isBranchBound}
          defaultBranchId={user?.branchId ?? undefined}
          serverFieldErrors={serverFieldErrors}
          onClose={() => {
            if (saving) return;
            setFormOpen(false);
            setEditingGroup(null);
            setServerFieldErrors({});
          }}
          onSubmit={handleFormSubmit}
          onBranchChange={(branchId) => {
            if (branchId) {
              fetchCenterList({ page: 1, perPage: 200, branchId, isActive: 1 }).then((res) =>
                setCenters(res.items),
              );
              fetchStaffList({ page: 1, perPage: 200, branchId, status: 1 }).then((res) =>
                setStaff(res.items),
              );
            }
          }}
        />
      ) : null}

      {/* Status Confirm Dialog */}
      {statusDialogTarget && statusDialogNext != null ? (
        <GroupStatusConfirmDialog
          group={statusDialogTarget}
          targetStatus={statusDialogNext}
          onClose={() => {
            setStatusDialogTarget(null);
            setStatusDialogNext(null);
          }}
          onConfirm={handleExecuteStatusChange}
        />
      ) : null}
    </ModulePageShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      <p
        className={`mt-2 inline-flex rounded-xl px-2.5 py-1 text-lg font-semibold ${tone}`}
      >
        {value}
      </p>
    </div>
  );
}
