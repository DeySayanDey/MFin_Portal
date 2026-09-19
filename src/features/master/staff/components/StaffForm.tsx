"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  CheckRow,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/Form";
import {
  staffCreateInputSchema,
  staffUpdateInputSchema,
} from "@/features/master/staff/schemas/staff.schema";
import type {
  DesignationOption,
  ModuleAccessOption,
  Staff,
  StaffCreateInput,
  StaffUpdateInput,
} from "@/features/master/staff/types/staff.types";
import type { Branch } from "@/features/master/branch/types/branch.types";

type StaffFormProps = {
  open: boolean;
  mode: "create" | "edit";
  staff: Staff | null;
  branches: Branch[];
  designations: DesignationOption[];
  modules: ModuleAccessOption[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmitCreate: (input: StaffCreateInput) => Promise<void> | void;
  onSubmitUpdate: (input: StaffUpdateInput) => Promise<void> | void;
};

type FormState = {
  fullName: string;
  employeeCode: string;
  branchId: string;
  designationId: string;
  mobile: string;
  email: string;
  joinDate: string;
  aadhaar: string;
  pan: string;
  monthlySalary: string;
  collectionTarget: string;
  assignment: string;
  moduleIds: number[];
  status: number;
};

function toFormState(staff: Staff | null): FormState {
  if (!staff) {
    return {
      fullName: "",
      employeeCode: "",
      branchId: "",
      designationId: "",
      mobile: "",
      email: "",
      joinDate: "",
      aadhaar: "",
      pan: "",
      monthlySalary: "",
      collectionTarget: "",
      assignment: "",
      moduleIds: [],
      status: 1,
    };
  }
  return {
    fullName: staff.fullName,
    employeeCode: staff.employeeCode,
    branchId: staff.branchId != null ? String(staff.branchId) : "",
    designationId:
      staff.designationId != null ? String(staff.designationId) : "",
    mobile: staff.mobile ?? "",
    email: staff.email ?? "",
    joinDate: staff.joinDate ?? "",
    aadhaar: staff.aadhaar ?? "",
    pan: staff.pan ?? "",
    monthlySalary:
      staff.monthlySalary != null ? String(staff.monthlySalary) : "",
    collectionTarget:
      staff.collectionTarget != null ? String(staff.collectionTarget) : "",
    assignment: staff.assignment ?? "",
    moduleIds: staff.moduleAccess.map((item) => item.moduleId),
    status: staff.status,
  };
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toWritablePayload(form: FormState): StaffCreateInput {
  return {
    fullName: form.fullName,
    employeeCode: form.employeeCode || null,
    branchId: form.branchId ? Number(form.branchId) : null,
    designationId: form.designationId ? Number(form.designationId) : null,
    mobile: form.mobile || null,
    email: form.email || null,
    joinDate: form.joinDate || null,
    aadhaar: form.aadhaar || null,
    pan: form.pan || null,
    monthlySalary: parseOptionalNumber(form.monthlySalary),
    collectionTarget: parseOptionalNumber(form.collectionTarget),
    assignment: form.assignment || null,
    moduleIds: form.moduleIds,
    status: form.status,
  };
}

export function StaffForm({
  open,
  mode,
  staff,
  branches,
  designations,
  modules,
  saving,
  errorMessage,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: StaffFormProps) {
  const t = useTranslations("master.staff");
  const tUi = useTranslations("ui");
  const formKey = mode === "edit" ? `edit-${staff?.staffId ?? 0}` : "create";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("createTitle") : t("editTitle")}
      size="xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="staff-form" icon={Save} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <StaffFormBody
        key={formKey}
        mode={mode}
        staff={staff}
        branches={branches}
        designations={designations}
        modules={modules}
        errorMessage={errorMessage}
        onSubmitCreate={onSubmitCreate}
        onSubmitUpdate={onSubmitUpdate}
        statusActiveLabel={t("statusActive")}
        statusInactiveLabel={t("statusInactive")}
        selectSearch={tUi("selectSearch")}
        selectEmpty={tUi("selectEmpty")}
        noneLabel={t("fields.none")}
        moduleAccessLabel={t("fields.moduleAccess")}
        fieldLabels={{
          fullName: t("fields.fullName"),
          employeeCode: t("fields.employeeCode"),
          branchId: t("fields.branch"),
          designationId: t("fields.designation"),
          mobile: t("fields.mobile"),
          email: t("fields.email"),
          joinDate: t("fields.joinDate"),
          aadhaar: t("fields.aadhaar"),
          pan: t("fields.pan"),
          monthlySalary: t("fields.monthlySalary"),
          collectionTarget: t("fields.collectionTarget"),
          assignment: t("fields.assignment"),
          status: t("fields.status"),
        }}
      />
    </Modal>
  );
}

type BodyProps = {
  mode: "create" | "edit";
  staff: Staff | null;
  branches: Branch[];
  designations: DesignationOption[];
  modules: ModuleAccessOption[];
  errorMessage?: string | null;
  onSubmitCreate: (input: StaffCreateInput) => Promise<void> | void;
  onSubmitUpdate: (input: StaffUpdateInput) => Promise<void> | void;
  statusActiveLabel: string;
  statusInactiveLabel: string;
  selectSearch: string;
  selectEmpty: string;
  noneLabel: string;
  moduleAccessLabel: string;
  fieldLabels: {
    fullName: string;
    employeeCode: string;
    branchId: string;
    designationId: string;
    mobile: string;
    email: string;
    joinDate: string;
    aadhaar: string;
    pan: string;
    monthlySalary: string;
    collectionTarget: string;
    assignment: string;
    status: string;
  };
};

function StaffFormBody({
  mode,
  staff,
  branches,
  designations,
  modules,
  errorMessage,
  onSubmitCreate,
  onSubmitUpdate,
  statusActiveLabel,
  statusInactiveLabel,
  selectSearch,
  selectEmpty,
  noneLabel,
  moduleAccessLabel,
  fieldLabels,
}: BodyProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(staff));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function toggleModule(moduleId: number, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      moduleIds: checked
        ? [...new Set([...prev.moduleIds, moduleId])]
        : prev.moduleIds.filter((id) => id !== moduleId),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    if (mode === "create") {
      const payload = toWritablePayload(form);
      const parsed = staffCreateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        const next: Record<string, string> = {};
        for (const [key, messages] of Object.entries(flat)) {
          if (messages?.[0]) next[key] = messages[0];
        }
        setFieldErrors(next);
        return;
      }
      await onSubmitCreate(parsed.data);
      return;
    }

    if (!staff) return;
    const writable = toWritablePayload(form);
    const payload: StaffUpdateInput = {
      ...writable,
      staffId: staff.staffId,
      employeeCode: form.employeeCode.trim() || staff.employeeCode,
    };
    const parsed = staffUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flat)) {
        if (messages?.[0]) next[key] = messages[0];
      }
      setFieldErrors(next);
      return;
    }
    await onSubmitUpdate(parsed.data);
  }

  return (
    <form
      id="staff-form"
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-4"
    >
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={fieldLabels.fullName}
          required
          value={form.fullName}
          maxLength={100}
          error={fieldErrors.fullName}
          onChange={(fullName) => setForm((prev) => ({ ...prev, fullName }))}
        />
        <TextField
          label={fieldLabels.employeeCode}
          value={form.employeeCode}
          maxLength={50}
          error={fieldErrors.employeeCode}
          onChange={(employeeCode) =>
            setForm((prev) => ({ ...prev, employeeCode }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={fieldLabels.branchId}
          value={form.branchId}
          searchable
          searchPlaceholder={selectSearch}
          emptyMessage={selectEmpty}
          onChange={(branchId) => setForm((prev) => ({ ...prev, branchId }))}
          options={[
            { value: "", label: noneLabel },
            ...branches.map((branch) => ({
              value: String(branch.branchId),
              label: `${branch.branchCode} — ${branch.branchName}`,
            })),
          ]}
        />
        <SelectField
          label={fieldLabels.designationId}
          value={form.designationId}
          searchable
          searchPlaceholder={selectSearch}
          emptyMessage={selectEmpty}
          onChange={(designationId) =>
            setForm((prev) => ({ ...prev, designationId }))
          }
          options={[
            { value: "", label: noneLabel },
            ...designations.map((item) => ({
              value: String(item.designationId),
              label: item.designationName,
            })),
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={fieldLabels.mobile}
          value={form.mobile}
          error={fieldErrors.mobile}
          onChange={(mobile) => setForm((prev) => ({ ...prev, mobile }))}
        />
        <TextField
          label={fieldLabels.email}
          type="email"
          value={form.email}
          error={fieldErrors.email}
          onChange={(email) => setForm((prev) => ({ ...prev, email }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={fieldLabels.joinDate}
          type="date"
          value={form.joinDate}
          error={fieldErrors.joinDate}
          onChange={(joinDate) => setForm((prev) => ({ ...prev, joinDate }))}
        />
        <SelectField
          label={fieldLabels.status}
          value={String(form.status)}
          searchable={false}
          searchPlaceholder={selectSearch}
          emptyMessage={selectEmpty}
          onChange={(status) =>
            setForm((prev) => ({ ...prev, status: Number(status) }))
          }
          options={[
            { value: "1", label: statusActiveLabel },
            { value: "0", label: statusInactiveLabel },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={fieldLabels.aadhaar}
          value={form.aadhaar}
          error={fieldErrors.aadhaar}
          onChange={(aadhaar) => setForm((prev) => ({ ...prev, aadhaar }))}
        />
        <TextField
          label={fieldLabels.pan}
          value={form.pan}
          error={fieldErrors.pan}
          onChange={(pan) => setForm((prev) => ({ ...prev, pan }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={fieldLabels.monthlySalary}
          type="number"
          value={form.monthlySalary}
          error={fieldErrors.monthlySalary}
          onChange={(monthlySalary) =>
            setForm((prev) => ({ ...prev, monthlySalary }))
          }
        />
        <TextField
          label={fieldLabels.collectionTarget}
          type="number"
          value={form.collectionTarget}
          error={fieldErrors.collectionTarget}
          onChange={(collectionTarget) =>
            setForm((prev) => ({ ...prev, collectionTarget }))
          }
        />
      </div>

      <TextAreaField
        label={fieldLabels.assignment}
        value={form.assignment}
        error={fieldErrors.assignment}
        onChange={(assignment) => setForm((prev) => ({ ...prev, assignment }))}
      />

      {modules.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-slate-600">
            {moduleAccessLabel}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {modules.map((mod) => (
              <CheckRow
                key={mod.moduleId}
                label={mod.moduleLabel}
                checked={form.moduleIds.includes(mod.moduleId)}
                onChange={(checked) => toggleModule(mod.moduleId, checked)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
    </form>
  );
}
