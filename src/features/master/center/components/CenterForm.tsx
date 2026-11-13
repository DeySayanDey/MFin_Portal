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
  centerCreateInputSchema,
  centerUpdateInputSchema,
} from "@/features/master/center/schemas/center.schema";
import type {
  Center,
  CenterCreateInput,
  CenterUpdateInput,
} from "@/features/master/center/types/center.types";

type BranchOption = { value: string; label: string };

type CenterFormProps = {
  open: boolean;
  mode: "create" | "edit";
  center: Center | null;
  branchOptions: BranchOption[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onCreate: (input: CenterCreateInput) => Promise<void> | void;
  onUpdate: (input: CenterUpdateInput) => Promise<void> | void;
};

type FormState = {
  branchId: string;
  centerName: string;
  centerAddress: string;
  isActive: boolean;
};

function toFormState(
  center: Center | null,
  defaultBranchId: string,
): FormState {
  if (!center) {
    return {
      branchId: defaultBranchId,
      centerName: "",
      centerAddress: "",
      isActive: true,
    };
  }
  return {
    branchId: String(center.branchId),
    centerName: center.centerName,
    centerAddress: center.centerAddress ?? "",
    isActive: center.isActive,
  };
}

export function CenterForm({
  open,
  mode,
  center,
  branchOptions,
  saving,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: CenterFormProps) {
  const t = useTranslations("master.center");
  const formKey = mode === "edit" ? `edit-${center?.centerId ?? 0}` : "create";
  const defaultBranchId = branchOptions[0]?.value ?? "";

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
            form="center-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <CenterFormBody
        key={formKey}
        mode={mode}
        center={center}
        branchOptions={branchOptions}
        defaultBranchId={defaultBranchId}
        errorMessage={errorMessage}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </Modal>
  );
}

function CenterFormBody({
  mode,
  center,
  branchOptions,
  defaultBranchId,
  errorMessage,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  center: Center | null;
  branchOptions: BranchOption[];
  defaultBranchId: string;
  errorMessage?: string | null;
  onCreate: (input: CenterCreateInput) => Promise<void> | void;
  onUpdate: (input: CenterUpdateInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.center");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() =>
    toFormState(center, defaultBranchId),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const branchId = Number(form.branchId);
    const base = {
      branchId: Number.isFinite(branchId) ? branchId : 0,
      centerName: form.centerName.trim(),
      centerAddress: form.centerAddress.trim() || null,
      isActive: form.isActive,
    };

    if (mode === "edit" && center) {
      const payload: CenterUpdateInput = {
        ...base,
        centerId: center.centerId,
      };
      const parsed = centerUpdateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          branchId: flat.branchId?.[0] ?? "",
          centerName: flat.centerName?.[0] ?? "",
          centerAddress: flat.centerAddress?.[0] ?? "",
        });
        return;
      }
      await onUpdate(parsed.data);
      return;
    }

    const parsed = centerCreateInputSchema.safeParse(base);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        branchId: flat.branchId?.[0] ?? "",
        centerName: flat.centerName?.[0] ?? "",
        centerAddress: flat.centerAddress?.[0] ?? "",
      });
      return;
    }
    await onCreate(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="center-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      {errorMessage ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <SelectField
        label={t("fields.branch")}
        value={form.branchId}
        required
        searchable
        placeholder={t("fields.branchPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.branchId || undefined}
        onChange={(branchId) => updateField("branchId", branchId)}
        options={branchOptions}
      />

      <TextField
        label={t("fields.centerName")}
        value={form.centerName}
        required
        maxLength={100}
        error={fieldErrors.centerName || undefined}
        onChange={(value) => updateField("centerName", value)}
      />

      <TextAreaField
        label={t("fields.centerAddress")}
        value={form.centerAddress}
        hint={t("hints.centerAddress")}
        error={fieldErrors.centerAddress || undefined}
        onChange={(value) => updateField("centerAddress", value)}
      />

      <CheckboxField
        label={t("fields.isActive")}
        checked={form.isActive}
        onChange={(checked) => updateField("isActive", checked)}
      />
    </form>
  );
}
