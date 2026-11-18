"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { CheckboxField, TextField, DateField } from "@/components/ui/Form";
import { finYearSaveInputSchema } from "@/features/master/fin-year/schemas/fin-year.schema";
import type {
  FinYear,
  FinYearSaveInput,
} from "@/features/master/fin-year/types/fin-year.types";

type FinYearFormProps = {
  open: boolean;
  mode: "create" | "edit";
  year: FinYear | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: FinYearSaveInput) => Promise<void> | void;
};

type FormState = {
  yearName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

function toFormState(year: FinYear | null): FormState {
  if (!year) {
    return {
      yearName: "",
      startDate: "",
      endDate: "",
      isActive: false,
    };
  }
  return {
    yearName: year.yearName,
    startDate: year.startDate,
    endDate: year.endDate,
    isActive: year.isActive,
  };
}

export function FinYearForm({
  open,
  mode,
  year,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: FinYearFormProps) {
  const t = useTranslations("master.finYear");
  const formKey = mode === "edit" ? `edit-${year?.yearId ?? 0}` : "create";

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
          <Button type="submit" form="fin-year-form" icon={Save} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <FinYearFormBody
        key={formKey}
        mode={mode}
        year={year}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function FinYearFormBody({
  mode,
  year,
  errorMessage,
  onSubmit,
}: {
  mode: "create" | "edit";
  year: FinYear | null;
  errorMessage?: string | null;
  onSubmit: (input: FinYearSaveInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.finYear");
  const [form, setForm] = useState<FormState>(() => toFormState(year));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const payload: FinYearSaveInput = {
      ...(mode === "edit" && year ? { yearId: year.yearId } : {}),
      yearName: form.yearName.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      isActive: form.isActive,
    };

    const parsed = finYearSaveInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        yearName: flat.yearName ? t("errors.yearName") : "",
        startDate: flat.startDate ? t("errors.startDate") : "",
        endDate: flat.endDate ? t("errors.endDate") : "",
      });
      return;
    }

    await onSubmit(parsed.data);
  }

  return (
    <form autoComplete="off" id="fin-year-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <PageToast message={errorMessage ?? null} tone="error" />

      <TextField
        label={t("fields.yearName")}
        value={form.yearName}
        required
        maxLength={25}
        placeholder={t("fields.yearNamePlaceholder")}
        error={fieldErrors.yearName || undefined}
        onChange={(value) => updateField("yearName", value)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField
          label={t("fields.startDate")}
          value={form.startDate}
          required
          error={fieldErrors.startDate || undefined}
          onChange={(value) => updateField("startDate", value)}
        />
        <DateField
          label={t("fields.endDate")}
          value={form.endDate}
          required
          hint={t("hints.endDate")}
          error={fieldErrors.endDate || undefined}
          onChange={(value) => updateField("endDate", value)}
        />
      </div>

      <CheckboxField
        label={t("fields.isActive")}
        checked={form.isActive}
        onChange={(checked) => updateField("isActive", checked)}
      />
      {form.isActive ? (
        <p className="text-xs text-muted">{t("hints.isActive")}</p>
      ) : null}
    </form>
  );
}
