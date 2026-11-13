"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Save,
  Users,
  ExternalLink,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  DateField,
  FormField,
  SelectField,
  TextField,
  TextAreaField,
  CheckboxField,
} from "@/components/ui/Form";
import { TimePicker } from "@/components/ui/TimePicker";
import { Link } from "@/i18n/navigation";
import type { SelectOption } from "@/components/ui/Select";
import type { Group, GroupSaveInput } from "../types/group.types";
import type { Branch } from "@/features/master/branch/types/branch.types";
import type { Center } from "@/features/master/center/types/center.types";
import type { State } from "@/features/master/organization/types/organization.types";
import type { Staff } from "@/features/master/staff/types/staff.types";
import type { ApplOption } from "@/features/master/appl-options/types/appl-options.types";

export type GroupFormState = {
  groupName: string;
  branchId: string;
  groupTypeCd: string;
  refCode: string;
  centerId: string;
  formationDate: string;
  registrationNo: string;
  registrationDate: string;
  memberNo: string;
  groupGenderCd: string;
  foId: string;
  meetingFrequencyCd: string;
  meetingDayCd: string;
  meetingTime: string;
  villageName: string;
  gpName: string;
  blockName: string;
  districtName: string;
  stateCd: string;
  pinCode: string;
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  ifscCode: string;
  presidentMemberId: string;
  secretaryMemberId: string;
  treasurerMemberId: string;
  savingsAmount: string;
  internalLending: boolean;
  grade: string;
  gradeDate: string;
  admFees: string;
  remarks: string;
  statusCd: "1" | "2";
};

const EMPTY_FORM: GroupFormState = {
  groupName: "",
  branchId: "",
  groupTypeCd: "1",
  refCode: "",
  centerId: "",
  formationDate: "",
  registrationNo: "",
  registrationDate: "",
  memberNo: "10",
  groupGenderCd: "",
  foId: "",
  meetingFrequencyCd: "",
  meetingDayCd: "",
  meetingTime: "",
  villageName: "",
  gpName: "",
  blockName: "",
  districtName: "",
  stateCd: "",
  pinCode: "",
  bankName: "",
  bankBranch: "",
  bankAccountNo: "",
  ifscCode: "",
  presidentMemberId: "",
  secretaryMemberId: "",
  treasurerMemberId: "",
  savingsAmount: "",
  internalLending: false,
  grade: "",
  gradeDate: "",
  admFees: "",
  remarks: "",
  statusCd: "1",
};

export type GroupManagementFormProps = {
  open: boolean;
  editing: Group | null;
  saving: boolean;
  branches: Branch[];
  centers: Center[];
  staff: Staff[];
  states: State[];
  typeOptions: ApplOption[];
  genderOptions: ApplOption[];
  frequencyOptions: ApplOption[];
  dayOptions: ApplOption[];
  isBranchBound?: boolean;
  defaultBranchId?: number;
  serverFieldErrors?: Partial<Record<keyof GroupFormState, string>>;
  onClose: () => void;
  onSubmit: (input: GroupSaveInput) => void;
  onBranchChange?: (branchId: number | null) => void;
};

export function GroupManagementForm({
  open,
  editing,
  saving,
  branches,
  centers,
  staff,
  states,
  typeOptions,
  genderOptions,
  frequencyOptions,
  dayOptions,
  isBranchBound = false,
  defaultBranchId,
  serverFieldErrors = {},
  onClose,
  onSubmit,
  onBranchChange,
}: GroupManagementFormProps) {
  const [form, setForm] = useState<GroupFormState>(() => {
    if (editing) {
      return {
        groupName: editing.groupName,
        branchId: String(editing.branchId),
        groupTypeCd: String(editing.groupTypeCd),
        refCode: editing.refCode ?? "",
        centerId: editing.centerId ? String(editing.centerId) : "",
        formationDate: editing.formationDate ?? "",
        registrationNo: editing.registrationNo ?? "",
        registrationDate: editing.registrationDate ?? "",
        memberNo: editing.memberNo ? String(editing.memberNo) : "10",
        groupGenderCd: editing.groupGenderCd ? String(editing.groupGenderCd) : "",
        foId: editing.foId ? String(editing.foId) : "",
        meetingFrequencyCd: editing.meetingFrequencyCd
          ? String(editing.meetingFrequencyCd)
          : "",
        meetingDayCd: editing.meetingDayCd ? String(editing.meetingDayCd) : "",
        meetingTime: editing.meetingTime ?? "",
        villageName: editing.villageName ?? "",
        gpName: editing.gpName ?? "",
        blockName: editing.blockName ?? "",
        districtName: editing.districtName ?? "",
        stateCd: editing.stateCd ? String(editing.stateCd) : "",
        pinCode: editing.pinCode ?? "",
        bankName: editing.bankName ?? "",
        bankBranch: editing.bankBranch ?? "",
        bankAccountNo: editing.bankAccountNo ?? "",
        ifscCode: editing.ifscCode ?? "",
        presidentMemberId: editing.presidentMemberId
          ? String(editing.presidentMemberId)
          : "",
        secretaryMemberId: editing.secretaryMemberId
          ? String(editing.secretaryMemberId)
          : "",
        treasurerMemberId: editing.treasurerMemberId
          ? String(editing.treasurerMemberId)
          : "",
        savingsAmount:
          editing.savingsAmount != null ? String(editing.savingsAmount) : "",
        internalLending: Boolean(editing.internalLending),
        grade: editing.grade ?? "",
        gradeDate: editing.gradeDate ?? "",
        admFees: editing.admFees != null ? String(editing.admFees) : "",
        remarks: editing.remarks ?? "",
        statusCd: editing.statusCd === 2 ? "2" : "1",
      };
    }
    return {
      ...EMPTY_FORM,
      branchId: defaultBranchId ? String(defaultBranchId) : "",
    };
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof GroupFormState, string>>
  >({});

  // Sync form state when editing changes or re-fetches
  useEffect(() => {
    if (editing) {
      setForm({
        groupName: editing.groupName,
        branchId: String(editing.branchId),
        groupTypeCd: String(editing.groupTypeCd),
        refCode: editing.refCode ?? "",
        centerId: editing.centerId ? String(editing.centerId) : "",
        formationDate: editing.formationDate ?? "",
        registrationNo: editing.registrationNo ?? "",
        registrationDate: editing.registrationDate ?? "",
        memberNo: editing.memberNo ? String(editing.memberNo) : "10",
        groupGenderCd: editing.groupGenderCd ? String(editing.groupGenderCd) : "",
        foId: editing.foId ? String(editing.foId) : "",
        meetingFrequencyCd: editing.meetingFrequencyCd
          ? String(editing.meetingFrequencyCd)
          : "",
        meetingDayCd: editing.meetingDayCd ? String(editing.meetingDayCd) : "",
        meetingTime: editing.meetingTime ?? "",
        villageName: editing.villageName ?? "",
        gpName: editing.gpName ?? "",
        blockName: editing.blockName ?? "",
        districtName: editing.districtName ?? "",
        stateCd: editing.stateCd ? String(editing.stateCd) : "",
        pinCode: editing.pinCode ?? "",
        bankName: editing.bankName ?? "",
        bankBranch: editing.bankBranch ?? "",
        bankAccountNo: editing.bankAccountNo ?? "",
        ifscCode: editing.ifscCode ?? "",
        presidentMemberId: editing.presidentMemberId
          ? String(editing.presidentMemberId)
          : "",
        secretaryMemberId: editing.secretaryMemberId
          ? String(editing.secretaryMemberId)
          : "",
        treasurerMemberId: editing.treasurerMemberId
          ? String(editing.treasurerMemberId)
          : "",
        savingsAmount:
          editing.savingsAmount != null ? String(editing.savingsAmount) : "",
        internalLending: Boolean(editing.internalLending),
        grade: editing.grade ?? "",
        gradeDate: editing.gradeDate ?? "",
        admFees: editing.admFees != null ? String(editing.admFees) : "",
        remarks: editing.remarks ?? "",
        statusCd: editing.statusCd === 2 ? "2" : "1",
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        branchId: defaultBranchId ? String(defaultBranchId) : "",
      });
    }
  }, [editing, defaultBranchId]);

  // Sync server errors when prop updates
  useEffect(() => {
    if (Object.keys(serverFieldErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
    }
  }, [serverFieldErrors]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const branchOptions: SelectOption[] = useMemo(
    () =>
      branches.map((b) => ({
        value: String(b.branchId),
        label: `${b.branchName} (${b.branchCode})`,
      })),
    [branches],
  );

  const centerOptions: SelectOption[] = useMemo(
    () =>
      centers.map((c) => ({
        value: String(c.centerId),
        label: c.centerName,
      })),
    [centers],
  );

  const staffOptions: SelectOption[] = useMemo(
    () =>
      staff.map((s) => ({
        value: String(s.staffId),
        label: `${s.fullName} (${s.employeeCode})`,
      })),
    [staff],
  );

  const stateOptions: SelectOption[] = useMemo(
    () =>
      states.map((s) => ({
        value: String(s.stateCd),
        label: s.stateName,
      })),
    [states],
  );

  const groupGenderOptions: SelectOption[] = useMemo(
    () =>
      genderOptions.map((o) => ({
        value: String(o.optCode),
        label: o.optDescription,
      })),
    [genderOptions],
  );

  const frequencySelectOptions: SelectOption[] = useMemo(
    () =>
      frequencyOptions.map((o) => ({
        value: String(o.optCode),
        label: o.optDescription,
      })),
    [frequencyOptions],
  );

  const daySelectOptions: SelectOption[] = useMemo(
    () =>
      dayOptions.map((o) => ({
        value: String(o.optCode),
        label: o.optDescription,
      })),
    [dayOptions],
  );

  // Office bearer options (president / secretary / treasurer)
  // For Edit, show president / secretary / treasurer and allow entering member ID or selecting
  const isBranchLocked = Boolean(
    isBranchBound || (editing && editing.activeMembers > 0),
  );

  function updateField<K extends keyof GroupFormState>(
    key: K,
    value: GroupFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleBranchChange(newBranchId: string) {
    updateField("branchId", newBranchId);
    updateField("centerId", "");
    updateField("foId", "");
    onBranchChange?.(newBranchId ? Number(newBranchId) : null);
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof GroupFormState, string>> = {};

    // Group name
    if (!form.groupName.trim()) {
      errors.groupName = "Group name is required.";
    } else if (form.groupName.trim().length > 250) {
      errors.groupName = "Maximum 250 characters.";
    }

    // Branch
    if (!form.branchId) {
      errors.branchId = "Branch is required.";
    }

    // Group type
    if (!form.groupTypeCd) {
      errors.groupTypeCd = "Group type is required.";
    }

    // Formation date
    if (form.formationDate && form.formationDate > today) {
      errors.formationDate = "Formation date cannot be in the future.";
    }

    // Registration date
    if (form.registrationDate && form.registrationDate > today) {
      errors.registrationDate = "Registration date cannot be in the future.";
    }
    if (
      form.formationDate &&
      form.registrationDate &&
      form.registrationDate < form.formationDate
    ) {
      errors.registrationDate =
        "Registration date must be on or after formation date.";
    }

    // Member number (min 4, max 10)
    const minMembers = editing ? Math.max(4, editing.activeMembers) : 4;
    if (form.memberNo) {
      const num = Number(form.memberNo);
      if (!/^\d+$/.test(form.memberNo) || num < minMembers || num > 10) {
        errors.memberNo = `Allowed range is ${minMembers}–10 members.`;
      }
    }

    // PIN code: 6 digits, not starting with 0
    if (form.pinCode && !/^[1-9]\d{5}$/.test(form.pinCode)) {
      errors.pinCode = "PIN must be 6 digits and cannot start with 0.";
    }

    // Bank Account & IFSC: must be given together
    const hasAccount = Boolean(form.bankAccountNo.trim());
    const hasIfsc = Boolean(form.ifscCode.trim());

    if (hasAccount && !/^\d{6,20}$/.test(form.bankAccountNo.trim())) {
      errors.bankAccountNo = "Bank account number must be 6–20 digits.";
    }

    if (hasIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.trim().toUpperCase())) {
      errors.ifscCode = "Enter a valid 11-character IFSC code (e.g. SBIN0001234).";
    }

    if (hasAccount && !hasIfsc) {
      errors.ifscCode = "IFSC code is required when bank account is entered.";
    }
    if (hasIfsc && !hasAccount) {
      errors.bankAccountNo =
        "Bank account number is required when IFSC is entered.";
    }

    // Grade and grade date
    if (form.gradeDate && form.gradeDate > today) {
      errors.gradeDate = "Grade date cannot be in the future.";
    }
    if (form.gradeDate && !form.grade.trim()) {
      errors.grade = "Grade is required when grade date is specified.";
    }

    // Savings & Admission fees
    if (
      form.savingsAmount &&
      (!/^\d+(\.\d{1,2})?$/.test(form.savingsAmount) ||
        Number(form.savingsAmount) > 999999.99)
    ) {
      errors.savingsAmount = "Enter a valid amount up to 999999.99.";
    }
    if (
      form.admFees &&
      (!/^\d+(\.\d{1,2})?$/.test(form.admFees) ||
        Number(form.admFees) > 9999.99)
    ) {
      errors.admFees = "Enter a valid fee up to 9999.99.";
    }

    // Office bearers: must be different if set
    if (editing) {
      const p = form.presidentMemberId ? Number(form.presidentMemberId) : null;
      const s = form.secretaryMemberId ? Number(form.secretaryMemberId) : null;
      const tr = form.treasurerMemberId ? Number(form.treasurerMemberId) : null;

      if (p && s && p === s) {
        errors.secretaryMemberId = "Secretary must be different from President.";
      }
      if (p && tr && p === tr) {
        errors.treasurerMemberId = "Treasurer must be different from President.";
      }
      if (s && tr && s === tr) {
        errors.treasurerMemberId = "Treasurer must be different from Secretary.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const valueOrNull = (v: string) => (v.trim() ? v.trim() : null);
    const numOrNull = (v: string) => (v.trim() ? Number(v.trim()) : null);

    const payload: GroupSaveInput = {
      ...(editing ? { groupId: editing.groupId } : {}),
      groupName: form.groupName.trim(),
      branchId: Number(form.branchId),
      groupTypeCd: Number(form.groupTypeCd),
      refCode: valueOrNull(form.refCode),
      centerId: numOrNull(form.centerId),
      formationDate: valueOrNull(form.formationDate),
      registrationNo: valueOrNull(form.registrationNo),
      registrationDate: valueOrNull(form.registrationDate),
      memberNo: numOrNull(form.memberNo),
      groupGenderCd: numOrNull(form.groupGenderCd),
      foId: numOrNull(form.foId),
      meetingFrequencyCd: numOrNull(form.meetingFrequencyCd),
      meetingDayCd: form.meetingFrequencyCd ? numOrNull(form.meetingDayCd) : null,
      meetingTime: valueOrNull(form.meetingTime),
      villageName: valueOrNull(form.villageName),
      gpName: valueOrNull(form.gpName),
      blockName: valueOrNull(form.blockName),
      districtName: valueOrNull(form.districtName),
      stateCd: numOrNull(form.stateCd),
      pinCode: valueOrNull(form.pinCode),
      bankName: valueOrNull(form.bankName),
      bankBranch: valueOrNull(form.bankBranch),
      bankAccountNo: valueOrNull(form.bankAccountNo),
      ifscCode: form.ifscCode ? form.ifscCode.trim().toUpperCase() : null,
      savingsAmount: numOrNull(form.savingsAmount),
      internalLending: form.internalLending,
      grade: form.grade ? form.grade.trim().toUpperCase() : null,
      gradeDate: valueOrNull(form.gradeDate),
      admFees: numOrNull(form.admFees),
      remarks: valueOrNull(form.remarks),
      ...(!editing ? { statusCd: Number(form.statusCd) as 1 | 2 } : {}),
      ...(editing
        ? {
            presidentMemberId: numOrNull(form.presidentMemberId),
            secretaryMemberId: numOrNull(form.secretaryMemberId),
            treasurerMemberId: numOrNull(form.treasurerMemberId),
          }
        : {}),
    };

    onSubmit(payload);
  }

  const cardStyle =
    "rounded-2xl border border-border bg-surface-muted/20 p-4 sm:p-5 transition";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? "Edit Group" : "New Group"}
        size="xl"
        className="max-h-[calc(100dvh-2rem)]"
        footer={
          <div className="flex w-full items-center justify-between">
            <div className="text-xs text-muted">
              {editing ? (
                <span>Editing Group Code: {editing.groupCode}</span>
              ) : (
                <span>Fields marked with * are required.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button icon={Save} loading={saving} onClick={handleSubmit}>
                Save Group
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Section 1: Basic Details */}
          <section className={cardStyle}>
            <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-2">
              <Building2 className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">
                1. Basic Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Group Name */}
              <TextField
                label="Group Name"
                required
                maxLength={250}
                placeholder="e.g. Maa Durga SHG"
                value={form.groupName}
                error={fieldErrors.groupName}
                onChange={(val) => updateField("groupName", val)}
              />

              {/* Group Type (Segmented control) */}
              <FormField
                label="Group Type"
                required
                error={fieldErrors.groupTypeCd}
              >
                <div className="flex h-10 rounded-xl border border-border bg-surface p-1">
                  <button
                    type="button"
                    className={`flex-1 rounded-lg text-xs font-bold transition ${
                      form.groupTypeCd === "1"
                        ? "bg-violet-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => updateField("groupTypeCd", "1")}
                  >
                    SHG
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg text-xs font-bold transition ${
                      form.groupTypeCd === "2"
                        ? "bg-cyan-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => updateField("groupTypeCd", "2")}
                  >
                    JLG
                  </button>
                </div>
              </FormField>

              {/* Branch */}
              {isBranchLocked ? (
                <Tooltip
                  label={
                    editing && editing.activeMembers > 0
                      ? "Branch can't change while the group has active members."
                      : "Locked to user branch."
                  }
                  side="top"
                >
                  <SelectField
                    label="Branch"
                    required
                    options={branchOptions}
                    value={form.branchId}
                    onChange={handleBranchChange}
                    disabled
                    error={fieldErrors.branchId}
                  />
                </Tooltip>
              ) : (
                <SelectField
                  label="Branch"
                  required
                  options={branchOptions}
                  value={form.branchId}
                  onChange={handleBranchChange}
                  error={fieldErrors.branchId}
                  placeholder="Select branch"
                />
              )}

              {/* Center */}
              <SelectField
                label="Center / Kendra"
                options={centerOptions}
                value={form.centerId}
                onChange={(val) => updateField("centerId", val)}
                disabled={!form.branchId}
                error={fieldErrors.centerId}
                placeholder="Select center (optional)"
              />

              {/* Formation Date */}
              <DateField
                label="Formation Date"
                value={form.formationDate}
                max={today}
                onChange={(val) => updateField("formationDate", val)}
                error={fieldErrors.formationDate}
              />

              {/* No. of Members */}
              <TextField
                label="No. of Members"
                type="number"
                min={editing ? Math.max(4, editing.activeMembers) : 4}
                max={10}
                placeholder="4–10"
                value={form.memberNo}
                error={fieldErrors.memberNo}
                hint={`Allowed ${
                  editing ? Math.max(4, editing.activeMembers) : 4
                }–10`}
                onChange={(val) => updateField("memberNo", val)}
              />

              {/* Group Gender */}
              <SelectField
                label="Group Gender"
                options={groupGenderOptions}
                value={form.groupGenderCd}
                onChange={(val) => updateField("groupGenderCd", val)}
                searchable={false}
                placeholder="Select gender"
              />

              {/* Ref Code */}
              <TextField
                label="Reference Code"
                maxLength={25}
                placeholder="e.g. NB-001"
                value={form.refCode}
                error={fieldErrors.refCode}
                hint="External code, e.g. NRLM / bank SHG code"
                onChange={(val) => updateField("refCode", val)}
              />

              {/* Registration No */}
              <TextField
                label="Registration No."
                maxLength={50}
                placeholder="e.g. REG/2026/1"
                value={form.registrationNo}
                error={fieldErrors.registrationNo}
                onChange={(val) => updateField("registrationNo", val)}
              />

              {/* Registration Date */}
              <DateField
                label="Registration Date"
                value={form.registrationDate}
                min={form.formationDate || undefined}
                max={today}
                onChange={(val) => updateField("registrationDate", val)}
                error={fieldErrors.registrationDate}
              />

              {/* Field Officer */}
              <SelectField
                label="Field Officer"
                options={staffOptions}
                value={form.foId}
                onChange={(val) => updateField("foId", val)}
                disabled={!form.branchId}
                placeholder="Select field officer"
              />
            </div>
          </section>

          {/* Section 2: Meeting Details */}
          <section className={cardStyle}>
            <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-2">
              <Clock className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">
                2. Meeting Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField
                label="Meeting Frequency"
                options={frequencySelectOptions}
                value={form.meetingFrequencyCd}
                searchable={false}
                placeholder="Select frequency"
                onChange={(val) => {
                  updateField("meetingFrequencyCd", val);
                  if (!val) updateField("meetingDayCd", "");
                }}
              />

              <SelectField
                label="Meeting Day"
                options={daySelectOptions}
                value={form.meetingDayCd}
                disabled={!form.meetingFrequencyCd}
                searchable={false}
                placeholder="Select day"
                onChange={(val) => updateField("meetingDayCd", val)}
              />

              <FormField label="Meeting Time" error={fieldErrors.meetingTime}>
                <TimePicker
                  value={form.meetingTime}
                  onChange={(val) => updateField("meetingTime", val)}
                  placeholder="Select time"
                />
              </FormField>
            </div>
          </section>

          {/* Section 3: Address */}
          <section className={cardStyle}>
            <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-2">
              <MapPin className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">
                3. Address Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                label="Village"
                maxLength={100}
                placeholder="Enter village"
                value={form.villageName}
                onChange={(val) => updateField("villageName", val)}
              />

              <TextField
                label="Gram Panchayat (GP)"
                maxLength={100}
                placeholder="Enter GP"
                value={form.gpName}
                onChange={(val) => updateField("gpName", val)}
              />

              <TextField
                label="Block"
                maxLength={100}
                placeholder="Enter block"
                value={form.blockName}
                onChange={(val) => updateField("blockName", val)}
              />

              <TextField
                label="District"
                maxLength={100}
                placeholder="Enter district"
                value={form.districtName}
                onChange={(val) => updateField("districtName", val)}
              />

              <SelectField
                label="State"
                options={stateOptions}
                value={form.stateCd}
                placeholder="Select state"
                onChange={(val) => updateField("stateCd", val)}
              />

              <TextField
                label="PIN Code"
                restrict="digits"
                maxLength={6}
                placeholder="e.g. 700091"
                value={form.pinCode}
                error={fieldErrors.pinCode}
                onChange={(val) => updateField("pinCode", val)}
              />
            </div>
          </section>

          {/* Section 4: Bank Details */}
          <section className={cardStyle}>
            <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-2">
              <CreditCard className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">
                4. Bank Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                label="Bank Name"
                maxLength={150}
                placeholder="e.g. State Bank of India"
                value={form.bankName}
                onChange={(val) => updateField("bankName", val)}
              />

              <TextField
                label="Bank Branch"
                maxLength={150}
                placeholder="e.g. Salt Lake Branch"
                value={form.bankBranch}
                onChange={(val) => updateField("bankBranch", val)}
              />

              <TextField
                label="Account Number"
                restrict="digits"
                maxLength={20}
                placeholder="6–20 digits"
                value={form.bankAccountNo}
                error={fieldErrors.bankAccountNo}
                onChange={(val) => updateField("bankAccountNo", val)}
              />

              <TextField
                label="IFSC Code"
                restrict="code"
                maxLength={11}
                placeholder="e.g. SBIN0001234"
                value={form.ifscCode}
                error={fieldErrors.ifscCode}
                onChange={(val) => updateField("ifscCode", val.toUpperCase())}
              />
            </div>
          </section>

          {/* Section 5: Office Bearers */}
          {editing ? (
            <section className={cardStyle}>
              <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-bold text-slate-900">
                    5. Office Bearers
                  </h3>
                </div>
                <Link
                  href={`/onboarding/group-member-mapping?groupId=${editing.groupId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  Group Member Mapping <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {editing.activeMembers === 0 ? (
                <div className="mb-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-3">
                  <p className="text-xs text-amber-800">
                    No active members mapped in this group yet. You can assign Member IDs below now, or map members first in Group Member Mapping.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  label="President Member ID"
                  restrict="digits"
                  placeholder="Enter member ID (e.g. 9001)"
                  value={form.presidentMemberId}
                  error={fieldErrors.presidentMemberId}
                  onChange={(val) => updateField("presidentMemberId", val)}
                  hint={editing.presidentName ? `Current: ${editing.presidentName}` : undefined}
                />

                <TextField
                  label="Secretary Member ID"
                  restrict="digits"
                  placeholder="Enter member ID (e.g. 9002)"
                  value={form.secretaryMemberId}
                  error={fieldErrors.secretaryMemberId}
                  onChange={(val) => updateField("secretaryMemberId", val)}
                  hint={editing.secretaryName ? `Current: ${editing.secretaryName}` : undefined}
                />

                <TextField
                  label="Treasurer Member ID"
                  restrict="digits"
                  placeholder="Enter member ID (e.g. 9003)"
                  value={form.treasurerMemberId}
                  error={fieldErrors.treasurerMemberId}
                  onChange={(val) => updateField("treasurerMemberId", val)}
                  hint={editing.treasurerName ? `Current: ${editing.treasurerName}` : undefined}
                />
              </div>
            </section>
          ) : (
            <section className={cardStyle}>
              <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                <Users className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold text-slate-900">
                  5. Office Bearers
                </h3>
              </div>
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5">
                <p className="text-xs text-muted">
                  Per business rules, office bearers (President, Secretary, Treasurer) are assigned after group creation once members are mapped. You will be able to assign them via <strong>Edit Group</strong> once the group is saved and members are added.
                </p>
              </div>
            </section>
          )}

          {/* Section 6: Financial, Operations & Status */}
          <section className={cardStyle}>
            <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-2">
              <FileText className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-slate-900">
                {editing ? "6." : "5."} Other Details & Settings
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                label="Monthly Savings Amount (₹)"
                restrict="decimal"
                placeholder="0.00"
                value={form.savingsAmount}
                error={fieldErrors.savingsAmount}
                onChange={(val) => updateField("savingsAmount", val)}
              />

              <TextField
                label="Grade"
                maxLength={10}
                placeholder="e.g. A"
                value={form.grade}
                error={fieldErrors.grade}
                onChange={(val) => updateField("grade", val.toUpperCase())}
              />

              <DateField
                label="Grade Date"
                value={form.gradeDate}
                max={today}
                onChange={(val) => updateField("gradeDate", val)}
                error={fieldErrors.gradeDate}
              />

              <TextField
                label="Admission Fees (₹)"
                restrict="decimal"
                placeholder="0.00"
                value={form.admFees}
                error={fieldErrors.admFees}
                onChange={(val) => updateField("admFees", val)}
              />

              <div className="col-span-full">
                <TextAreaField
                  label="Remarks"
                  maxLength={100}
                  placeholder="Additional notes (max 100 characters)"
                  value={form.remarks}
                  rows={2}
                  onChange={(val) => updateField("remarks", val)}
                  hint={`${form.remarks.length}/100 characters`}
                />
              </div>

              <div className="flex items-center pt-2">
                <CheckboxField
                  label="Internal Lending Active"
                  checked={form.internalLending}
                  onChange={(checked) =>
                    updateField("internalLending", checked)
                  }
                />
              </div>

              {/* Status on Add only */}
              {!editing ? (
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Initial Status:
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-800">
                    <input autoComplete="off"
                      type="radio"
                      name="initialStatus"
                      checked={form.statusCd === "1"}
                      onChange={() => updateField("statusCd", "1")}
                      className="text-brand focus:ring-brand"
                    />
                    Active
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-800">
                    <input autoComplete="off"
                      type="radio"
                      name="initialStatus"
                      checked={form.statusCd === "2"}
                      onChange={() => updateField("statusCd", "2")}
                      className="text-brand focus:ring-brand"
                    />
                    Inactive
                  </label>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
}
