"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/Form";
import {
  branchCreateInputSchema,
  branchUpdateInputSchema,
} from "@/features/master/branch/schemas/branch.schema";
import type {
  Branch,
  BranchCreateInput,
  BranchUpdateInput,
} from "@/features/master/branch/types/branch.types";

type BranchFormProps = {
  open: boolean;
  mode: "create" | "edit";
  branch: Branch | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmitCreate: (input: BranchCreateInput) => Promise<void> | void;
  onSubmitUpdate: (input: BranchUpdateInput) => Promise<void> | void;
};

type FormState = {
  branchName: string;
  branchAddress: string;
  branchMobile: string;
  branchMail: string;
  headerText: string;
  isHead: boolean;
  isActive: boolean;
};

function toFormState(branch: Branch | null): FormState {
  if (!branch) {
    return {
      branchName: "",
      branchAddress: "",
      branchMobile: "",
      branchMail: "",
      headerText: "",
      isHead: false,
      isActive: true,
    };
  }
  return {
    branchName: branch.branchName,
    branchAddress: branch.branchAddress ?? "",
    branchMobile: branch.branchMobile ?? "",
    branchMail: branch.branchMail ?? "",
    headerText: branch.headerText ?? "",
    isHead: branch.isHead,
    isActive: branch.isActive,
  };
}

function toWritablePayload(form: FormState): BranchCreateInput {
  return {
    branchName: form.branchName,
    branchAddress: form.branchAddress || null,
    branchMobile: form.branchMobile || null,
    branchMail: form.branchMail || null,
    headerText: form.headerText || null,
    isHead: form.isHead,
    isActive: form.isActive,
  };
}

export function BranchForm({
  open,
  mode,
  branch,
  saving,
  errorMessage,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: BranchFormProps) {
  const t = useTranslations("master.branch");
  const tUi = useTranslations("ui");
  const formKey = mode === "edit" ? `edit-${branch?.branchId ?? 0}` : "create";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("createTitle") : t("editTitle")}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="branch-form" icon={Save} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <BranchFormBody
        key={formKey}
        mode={mode}
        branch={branch}
        errorMessage={errorMessage}
        onSubmitCreate={onSubmitCreate}
        onSubmitUpdate={onSubmitUpdate}
        statusActiveLabel={t("statusActive")}
        statusInactiveLabel={t("statusInactive")}
        selectSearch={tUi("selectSearch")}
        selectEmpty={tUi("selectEmpty")}
        fieldLabels={{
          branchName: t("fields.branchName"),
          branchAddress: t("fields.branchAddress"),
          branchMobile: t("fields.branchMobile"),
          branchMail: t("fields.branchMail"),
          headerText: t("fields.headerText"),
          isHead: t("fields.isHead"),
          isActive: t("fields.isActive"),
        }}
      />
    </Modal>
  );
}

type BodyProps = {
  mode: "create" | "edit";
  branch: Branch | null;
  errorMessage?: string | null;
  onSubmitCreate: (input: BranchCreateInput) => Promise<void> | void;
  onSubmitUpdate: (input: BranchUpdateInput) => Promise<void> | void;
  statusActiveLabel: string;
  statusInactiveLabel: string;
  selectSearch: string;
  selectEmpty: string;
  fieldLabels: {
    branchName: string;
    branchAddress: string;
    branchMobile: string;
    branchMail: string;
    headerText: string;
    isHead: string;
    isActive: string;
  };
};

function BranchFormBody({
  mode,
  branch,
  errorMessage,
  onSubmitCreate,
  onSubmitUpdate,
  statusActiveLabel,
  statusInactiveLabel,
  selectSearch,
  selectEmpty,
  fieldLabels,
}: BodyProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(branch));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    if (mode === "create") {
      const payload = toWritablePayload(form);
      const parsed = branchCreateInputSchema.safeParse(payload);
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

    if (!branch) return;
    const payload: BranchUpdateInput = {
      ...toWritablePayload(form),
      branchId: branch.branchId,
      branchCode: branch.branchCode,
    };
    const parsed = branchUpdateInputSchema.safeParse(payload);
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
      id="branch-form"
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

      <TextField
        label={fieldLabels.branchName}
        required
        value={form.branchName}
        maxLength={100}
        error={fieldErrors.branchName}
        onChange={(branchName) => setForm((prev) => ({ ...prev, branchName }))}
      />

      <TextAreaField
        label={fieldLabels.branchAddress}
        value={form.branchAddress}
        error={fieldErrors.branchAddress}
        onChange={(branchAddress) =>
          setForm((prev) => ({ ...prev, branchAddress }))
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={fieldLabels.branchMobile}
          value={form.branchMobile}
          maxLength={50}
          error={fieldErrors.branchMobile}
          onChange={(branchMobile) =>
            setForm((prev) => ({ ...prev, branchMobile }))
          }
        />
        <TextField
          label={fieldLabels.branchMail}
          type="email"
          value={form.branchMail}
          maxLength={50}
          error={fieldErrors.branchMail}
          onChange={(branchMail) => setForm((prev) => ({ ...prev, branchMail }))}
        />
      </div>

      <TextAreaField
        label={fieldLabels.headerText}
        value={form.headerText}
        error={fieldErrors.headerText}
        onChange={(headerText) => setForm((prev) => ({ ...prev, headerText }))}
      />

      <SelectField
        label={fieldLabels.isActive}
        value={form.isActive ? "1" : "0"}
        searchable={false}
        searchPlaceholder={selectSearch}
        emptyMessage={selectEmpty}
        onChange={(value) =>
          setForm((prev) => ({ ...prev, isActive: value === "1" }))
        }
        options={[
          { value: "1", label: statusActiveLabel },
          { value: "0", label: statusInactiveLabel },
        ]}
      />

      <CheckboxField
        label={fieldLabels.isHead}
        checked={form.isHead}
        onChange={(isHead) => setForm((prev) => ({ ...prev, isHead }))}
      />
    </form>
  );
}
