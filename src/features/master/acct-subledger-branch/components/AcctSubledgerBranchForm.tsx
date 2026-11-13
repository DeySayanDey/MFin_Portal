"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField } from "@/components/ui/Form";
import {
  acctSubledgerBranchCreateInputSchema,
  acctSubledgerBranchUpdateInputSchema,
} from "@/features/master/acct-subledger-branch/schemas/acct-subledger-branch.schema";
import type {
  AcctSubledgerBranch,
  AcctSubledgerBranchCreateInput,
  AcctSubledgerBranchUpdateInput,
} from "@/features/master/acct-subledger-branch/types/acct-subledger-branch.types";
import type { SelectOption } from "@/features/master/acct-subledger-branch/components/AcctSubledgerBranchFilters";

type AcctSubledgerBranchFormProps = {
  open: boolean;
  mode: "create" | "edit";
  mapping: AcctSubledgerBranch | null;
  subledgers: SelectOption[];
  branches: SelectOption[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onCreate: (input: AcctSubledgerBranchCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctSubledgerBranchUpdateInput) => Promise<void> | void;
};

type FormState = {
  branchId: string;
  subledgId: string;
  isActive: boolean;
};

function toFormState(mapping: AcctSubledgerBranch | null): FormState {
  if (!mapping) {
    return { branchId: "", subledgId: "", isActive: true };
  }
  return {
    branchId: String(mapping.branchId),
    subledgId: String(mapping.subledgId),
    isActive: mapping.isActive,
  };
}

export function AcctSubledgerBranchForm({
  open,
  mode,
  mapping,
  subledgers,
  branches,
  saving,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: AcctSubledgerBranchFormProps) {
  const t = useTranslations("master.acctSubledgerBranch");
  const formKey = mode === "edit" ? `edit-${mapping?.id ?? 0}` : "create";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("createTitle") : t("editTitle")}
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="acct-subledger-branch-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <AcctSubledgerBranchFormBody
        key={formKey}
        mode={mode}
        mapping={mapping}
        subledgers={subledgers}
        branches={branches}
        errorMessage={errorMessage}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </Modal>
  );
}

function AcctSubledgerBranchFormBody({
  mode,
  mapping,
  subledgers,
  branches,
  errorMessage,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  mapping: AcctSubledgerBranch | null;
  subledgers: SelectOption[];
  branches: SelectOption[];
  errorMessage?: string | null;
  onCreate: (input: AcctSubledgerBranchCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctSubledgerBranchUpdateInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.acctSubledgerBranch");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() => toFormState(mapping));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const branchId = Number(form.branchId);
    const subledgId = Number(form.subledgId);
    const base = {
      branchId: Number.isFinite(branchId) && branchId > 0 ? branchId : 0,
      subledgId: Number.isFinite(subledgId) && subledgId > 0 ? subledgId : 0,
      isActive: form.isActive,
    };

    if (mode === "edit" && mapping) {
      const payload: AcctSubledgerBranchUpdateInput = {
        ...base,
        id: mapping.id,
      };
      const parsed = acctSubledgerBranchUpdateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          branchId: flat.branchId?.[0] ?? "",
          subledgId: flat.subledgId?.[0] ?? "",
        });
        return;
      }
      await onUpdate(parsed.data);
      return;
    }

    const parsed = acctSubledgerBranchCreateInputSchema.safeParse(base);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        branchId: flat.branchId?.[0] ?? "",
        subledgId: flat.subledgId?.[0] ?? "",
      });
      return;
    }
    await onCreate(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="acct-subledger-branch-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />

      <SelectField
        label={t("fields.branchId")}
        value={form.branchId}
        required
        searchable
        placeholder={t("fields.branchIdPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.branchId || undefined}
        onChange={(branchId) => updateField("branchId", branchId)}
        options={branches}
      />

      <SelectField
        label={t("fields.subledgId")}
        value={form.subledgId}
        required
        searchable
        placeholder={t("fields.subledgIdPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.subledgId || undefined}
        onChange={(subledgId) => updateField("subledgId", subledgId)}
        options={subledgers}
      />

      <CheckboxField
        label={t("fields.isActive")}
        checked={form.isActive}
        onChange={(checked) => updateField("isActive", checked)}
      />
    </form>
  );
}
