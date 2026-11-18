"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { showToast } from "@/components/ui/toast";
import { useRouter } from "@/i18n/navigation";
import { getStoredAuthUser } from "@/features/auth/utils/auth-user-storage";
import { onboardingModulePages } from "@/lib/modules/module.types";
import {
  fetchMembers,
  isMemberClientError,
  saveMember,
  updateMemberStatus,
} from "../services/member-client";
import type {
  Member,
  MemberFilterValues,
  MemberListResult,
  MemberSaveInput,
  MemberStatus,
} from "../types/member.types";
import { fetchBranchList } from "@/features/master/branch/services/branch-client";
import { fetchCenterList } from "@/features/master/center/services/center-client";
import { fetchStaffList } from "@/features/master/staff/services/staff-client";
import { fetchGroups } from "@/features/onboarding/group-management/services/group-client";
import { fetchApplOptions } from "@/features/master/appl-options/services/appl-options-client";
import type { Branch } from "@/features/master/branch/types/branch.types";
import type { Center } from "@/features/master/center/types/center.types";
import type { Staff } from "@/features/master/staff/types/staff.types";
import type { ApplOption } from "@/features/master/appl-options/types/appl-options.types";
import type { Group } from "@/features/onboarding/group-management/types/group.types";
import { MemberRegistrationFilters } from "./MemberRegistrationFilters";
import { MemberRegistrationTable } from "./MemberRegistrationTable";
import { MemberRegistrationDrawer } from "./MemberRegistrationDrawer";
import { MemberRegistrationForm, type MemberFormState } from "./MemberRegistrationForm";
import { MemberStatusConfirmDialog } from "./MemberStatusConfirmDialog";
import { MemberKycModal } from "@/features/onboarding/member-kyc";
import { MemberLocationModal } from "@/features/onboarding/member-location";

const DEFAULT_FILTERS: MemberFilterValues = {
  keyword: "",
  branchId: "",
  centerId: "",
  groupId: "",
  foId: "",
  genderCd: "",
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
): Partial<Record<keyof MemberFormState, string>> {
  const result: Partial<Record<keyof MemberFormState, string>> = {};
  const fieldMap: Record<string, keyof MemberFormState> = {
    member_name: "memberName",
    memberName: "memberName",
    gender_cd: "genderCd",
    genderCd: "genderCd",
    date_of_birth: "dateOfBirth",
    dateOfBirth: "dateOfBirth",
    mobile_no: "mobileNo",
    mobileNo: "mobileNo",
    branch_id: "branchId",
    branchId: "branchId",
    ref_code: "refCode",
    refCode: "refCode",
    father_name: "fatherName",
    fatherName: "fatherName",
    mother_name: "motherName",
    motherName: "motherName",
    spouse_name: "spouseName",
    spouseName: "spouseName",
    marital_status_cd: "maritalStatusCd",
    maritalStatusCd: "maritalStatusCd",
    religion_cd: "religionCd",
    religionCd: "religionCd",
    caste_cd: "casteCd",
    casteCd: "casteCd",
    alternate_mobile_no: "alternateMobileNo",
    alternateMobileNo: "alternateMobileNo",
    email_id: "emailId",
    emailId: "emailId",
    pan_no: "panNo",
    panNo: "panNo",
    center_id: "centerId",
    centerId: "centerId",
    joining_date: "joiningDate",
    joiningDate: "joiningDate",
    bank_account_no: "bankAccountNo",
    bankAccountNo: "bankAccountNo",
    ifsc_code: "ifscCode",
    ifscCode: "ifscCode",
    nominee_name: "nomineeName",
    nomineeName: "nomineeName",
    nominee_relation: "nomineeRelation",
    nomineeRelation: "nomineeRelation",
    nominee_dob: "nomineeDob",
    nomineeDob: "nomineeDob",
    nominee_mobile: "nomineeMobile",
    nomineeMobile: "nomineeMobile",
    fo_id: "foId",
    foId: "foId",
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
  if (lower.includes("member name") && !result.memberName) {
    result.memberName = message;
  } else if ((lower.includes("reference code") || lower.includes("ref code")) && !result.refCode) {
    result.refCode = message;
  } else if (lower.includes("mobile") && !result.mobileNo) {
    result.mobileNo = message;
  } else if (lower.includes("date of birth") || lower.includes("18") && !result.dateOfBirth) {
    result.dateOfBirth = message;
  } else if (lower.includes("pan") && !result.panNo) {
    result.panNo = message;
  } else if (lower.includes("bank account") && !result.bankAccountNo) {
    result.bankAccountNo = message;
  } else if (lower.includes("ifsc") && !result.ifscCode) {
    result.ifscCode = message;
  } else if (lower.includes("branch") && !result.branchId) {
    result.branchId = message;
  }

  return result;
}

export function MemberRegistrationView() {
  const router = useRouter();
  const pageMeta = useMemo(() => onboardingModulePages.memberRegistration.toJSON(), []);
  const [user] = useState(() => getStoredAuthUser());
  const isBranchBound = Boolean(user && !user.isHead && !user.isAdmin && user.branchId);

  // Read initial query params from window on mount
  const initialParams = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const [filters, setFilters] = useState<MemberFilterValues>(() => ({
    keyword: initialParams.get("keyword") || "",
    branchId:
      isBranchBound && user?.branchId
        ? String(user.branchId)
        : initialParams.get("branch_id") || "",
    centerId: initialParams.get("center_id") || "",
    groupId: initialParams.get("group_id") || "",
    foId: initialParams.get("fo_id") || "",
    genderCd: initialParams.get("gender_cd") || "",
    statusCd: initialParams.get("status_cd") || "",
  }));

  const [page, setPage] = useState<number>(() => {
    const p = Number(initialParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  });

  const [pageSize, setPageSize] = useState<number>(() => {
    const ps = Number(initialParams.get("per_page"));
    return Number.isFinite(ps) && ps > 0 ? ps : 50;
  });

  // Debounced search query
  const [debouncedKeyword, setDebouncedKeyword] = useState(filters.keyword);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(filters.keyword);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters.keyword]);

  // Master lookup data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [genderOptions, setGenderOptions] = useState<ApplOption[]>([]);
  const [maritalOptions, setMaritalOptions] = useState<ApplOption[]>([]);
  const [religionOptions, setReligionOptions] = useState<ApplOption[]>([]);
  const [casteOptions, setCasteOptions] = useState<ApplOption[]>([]);
  const [relationOptions, setRelationOptions] = useState<ApplOption[]>([]);

  // Main table data state
  const [items, setItems] = useState<Member[]>([]);
  const [meta, setMeta] = useState<MemberListResult["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Dialog & drawer states
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [kycMember, setKycMember] = useState<Member | null>(null);
  const [locationMember, setLocationMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<Partial<Record<keyof MemberFormState, string>>>({});
  const [statusDialogTarget, setStatusDialogTarget] = useState<Member | null>(null);
  const [statusDialogNext, setStatusDialogNext] = useState<MemberStatus | null>(null);

  const [successMessage, setSuccessMessage] = useToastText();

  // 1. Initial lookup loads
  useEffect(() => {
    let active = true;

    async function loadLookups() {
      try {
        const [bRes, gOpt, mOpt, rOpt, cOpt, relOpt] = await Promise.all([
          fetchBranchList({ page: 1, perPage: 200, isActive: 1 }),
          fetchApplOptions(28).catch(() => []),
          fetchApplOptions(29).catch(() => []),
          fetchApplOptions(30).catch(() => []),
          fetchApplOptions(32).catch(() => []),
          fetchApplOptions(35).catch(() => []),
        ]);
        if (!active) return;
        setBranches(bRes.items);
        setGenderOptions(gOpt);
        setMaritalOptions(mOpt);
        setReligionOptions(rOpt);
        setCasteOptions(cOpt);
        setRelationOptions(relOpt);
      } catch (err) {
        if (isMemberClientError(err) && err.status === 401) {
          router.replace("/login");
        }
      }
    }

    loadLookups();
    return () => {
      active = false;
    };
  }, [router]);

  // 2. Cascade lookups when branch changes
  useEffect(() => {
    let active = true;
    const branchIdNum = Number(filters.branchId);

    async function loadBranchCascade() {
      if (!branchIdNum) {
        setCenters([]);
        setStaff([]);
        setGroups([]);
        return;
      }
      try {
        const [cRes, sRes, grpRes] = await Promise.all([
          fetchCenterList({ page: 1, perPage: 200, branchId: branchIdNum, isActive: 1 }).catch(() => ({ items: [] })),
          fetchStaffList({ page: 1, perPage: 200, branchId: branchIdNum, status: 1 }).catch(() => ({ items: [] })),
          fetchGroups({ branchId: branchIdNum, statusCd: 1, perPage: 200 }).catch(() => ({ items: [] })),
        ]);
        if (!active) return;
        setCenters(cRes.items);
        setStaff(sRes.items);
        setGroups(grpRes.items);
      } catch {
        // ignore cascading errors
      }
    }

    loadBranchCascade();
    return () => {
      active = false;
    };
  }, [filters.branchId]);

  // One list request per settled filter. Search waits for the debounce.
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(false);
      setErrorMessage("");

      try {
        const res = await fetchMembers(
          {
            page,
            perPage: pageSize,
            keyword: debouncedKeyword.trim() || undefined,
            branchId: filters.branchId ? Number(filters.branchId) : undefined,
            centerId: filters.centerId ? Number(filters.centerId) : undefined,
            groupId: filters.groupId ? Number(filters.groupId) : undefined,
            foId: filters.foId ? Number(filters.foId) : undefined,
            genderCd: filters.genderCd ? Number(filters.genderCd) : undefined,
            statusCd: filters.statusCd ? (Number(filters.statusCd) as MemberStatus) : undefined,
          },
          { generation: reloadKey, replace: true },
        );
        if (!active) return;

        setItems(res.items);
        setMeta(res.meta);
        updateUrlQuery({
          page: page > 1 ? page : undefined,
          per_page: pageSize !== 50 ? pageSize : undefined,
          keyword: debouncedKeyword || undefined,
          branch_id: filters.branchId || undefined,
          center_id: filters.centerId || undefined,
          group_id: filters.groupId || undefined,
          fo_id: filters.foId || undefined,
          gender_cd: filters.genderCd || undefined,
          status_cd: filters.statusCd || undefined,
        });
      } catch (err) {
        if (!active) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (isMemberClientError(err) && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(true);
        const msg = isMemberClientError(err) ? err.message : "Failed to load member records.";
        setErrorMessage(msg);
        showToast(msg, "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [
    page,
    pageSize,
    debouncedKeyword,
    filters.branchId,
    filters.centerId,
    filters.groupId,
    filters.foId,
    filters.genderCd,
    filters.statusCd,
    reloadKey,
    router,
  ]);

  // Handlers
  const handleFilterReset = useCallback(() => {
    const defaultBranch = isBranchBound && user?.branchId ? String(user.branchId) : "";
    setFilters({ ...DEFAULT_FILTERS, branchId: defaultBranch });
    setPage(1);
  }, [isBranchBound, user]);

  const handleOpenCreate = useCallback(() => {
    setEditingMember(null);
    setServerFieldErrors({});
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((member: Member) => {
    if (member.statusCd === 4 || member.statusCd === 5) {
      showToast("Closed or Deceased members cannot be edited.", "warning");
      return;
    }
    setEditingMember(member);
    setServerFieldErrors({});
    setFormOpen(true);
  }, []);

  const handleView = useCallback((member: Member) => {
    setViewingMember(member);
  }, []);

  const handleRequestStatus = useCallback((member: Member, nextStatus: MemberStatus) => {
    setStatusDialogTarget(member);
    setStatusDialogNext(nextStatus);
  }, []);

  async function handleExecuteStatusChange() {
    if (!statusDialogTarget || statusDialogNext == null) return;
    const target = statusDialogTarget;
    const nextStatus = statusDialogNext;
    setStatusDialogTarget(null);
    setStatusDialogNext(null);

    try {
      const updated = await updateMemberStatus(target.memberId, nextStatus);
      const msg = `Member status updated to ${updated?.statusDesc || "new status"}`;
      setSuccessMessage(msg);
      showToast(msg, "success");
      setReloadKey((k) => k + 1);

      if (viewingMember && viewingMember.memberId === target.memberId) {
        setViewingMember(updated ? { ...viewingMember, ...updated } : null);
      }
    } catch (err) {
      if (isMemberClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      const msg = isMemberClientError(err) ? err.message : "Unable to change member status";
      showToast(msg, "error");
    }
  }

  async function handleFormSubmit(input: MemberSaveInput) {
    setSaving(true);
    setServerFieldErrors({});
    try {
      await saveMember(input);
      const msg = editingMember ? "Member updated successfully" : "Member created successfully";
      setSuccessMessage(msg);
      showToast(msg, "success");
      setFormOpen(false);
      setEditingMember(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (isMemberClientError(err) && err.status === 401) {
        router.replace("/login");
        return;
      }
      const msg = isMemberClientError(err) ? err.message : "Unable to save member";
      showToast(msg, "error");
      if (isMemberClientError(err)) {
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
    filters.groupId ||
    filters.foId ||
    filters.genderCd ||
    filters.statusCd,
  );

  const total = meta?.total ?? items.length;

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={successMessage} />

      {/* Stat Summary Cards (Exact Branch Directory & Group Management pattern) */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label="TOTAL MEMBERS"
          value={loading ? "…" : String(total)}
          tone="bg-blue-50 text-blue-700"
        />
      </div>

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

      {/* Top Filter Panel */}
      <MemberRegistrationFilters
        values={filters}
        branches={branches}
        centers={centers}
        groups={groups}
        staff={staff}
        genderOptions={genderOptions}
        isBranchBound={isBranchBound}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onReset={handleFilterReset}
      />

      {/* Main Members Directory Table */}
      <MemberRegistrationTable
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
        onOpenKyc={setKycMember}
        onOpenLocation={setLocationMember}
        onRequestStatusChange={handleRequestStatus}
        onResetFilters={handleFilterReset}
        onCreateNew={handleOpenCreate}
        headerActions={
          <Button
            type="button"
            icon={Plus}
            onClick={handleOpenCreate}
          >
            New Member
          </Button>
        }
      />

      <MemberKycModal member={kycMember} open={kycMember != null} onClose={() => setKycMember(null)} />
      <MemberLocationModal
        member={locationMember}
        open={locationMember != null}
        onClose={() => setLocationMember(null)}
      />

      {/* View Drawer (Read-only Slide-over) */}
      {viewingMember ? (
        <MemberRegistrationDrawer
          member={viewingMember}
          onClose={() => setViewingMember(null)}
          onEdit={(m) => {
            setViewingMember(null);
            handleOpenEdit(m);
          }}
          onRequestStatusChange={handleRequestStatus}
          onOpenLocation={setLocationMember}
        />
      ) : null}

      {/* Add / Edit Form Modal */}
      {formOpen ? (
        <MemberRegistrationForm
          open={formOpen}
          editing={editingMember}
          branches={branches}
          genderOptions={genderOptions}
          maritalOptions={maritalOptions}
          religionOptions={religionOptions}
          casteOptions={casteOptions}
          relationOptions={relationOptions}
          isBranchBound={isBranchBound}
          userBranchId={user?.branchId ?? undefined}
          serverFieldErrors={serverFieldErrors}
          submitting={saving}
          onClose={() => {
            setFormOpen(false);
            setEditingMember(null);
            setServerFieldErrors({});
          }}
          onSubmit={handleFormSubmit}
        />
      ) : null}

      {/* Status Confirm Dialog */}
      {statusDialogTarget && statusDialogNext != null ? (
        <MemberStatusConfirmDialog
          member={statusDialogTarget}
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
