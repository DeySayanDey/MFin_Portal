"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField, DateField } from "@/components/ui/Form";
import { holidaySaveInputSchema } from "@/features/master/holiday/schemas/holiday.schema";
import type {
  Holiday,
  HolidaySaveInput,
} from "@/features/master/holiday/types/holiday.types";
import {
  HOLIDAY_TYPE_FESTIVAL,
  HOLIDAY_TYPE_NATIONAL,
} from "@/features/master/holiday/types/holiday.types";

type YearOption = { value: string; label: string };

type HolidayFormProps = {
  open: boolean;
  mode: "create" | "edit";
  holiday: Holiday | null;
  yearOptions: YearOption[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: HolidaySaveInput) => Promise<void> | void;
};

type FormState = {
  yearSl: string;
  holidayDate: string;
  purpose: string;
  holiType: string;
};

function toFormState(holiday: Holiday | null, defaultYearSl: string): FormState {
  if (!holiday) {
    return {
      yearSl: defaultYearSl,
      holidayDate: "",
      purpose: "",
      holiType: String(HOLIDAY_TYPE_NATIONAL),
    };
  }
  return {
    yearSl: String(holiday.yearSl),
    holidayDate: holiday.holidayDate,
    purpose: holiday.purpose,
    holiType: String(holiday.holiType || HOLIDAY_TYPE_NATIONAL),
  };
}

export function HolidayForm({
  open,
  mode,
  holiday,
  yearOptions,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: HolidayFormProps) {
  const t = useTranslations("master.holiday");
  const formKey = mode === "edit" ? `edit-${holiday?.id ?? 0}` : "create";
  const defaultYearSl = yearOptions[0]?.value ?? "";

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
            form="holiday-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <HolidayFormBody
        key={formKey}
        mode={mode}
        holiday={holiday}
        yearOptions={yearOptions}
        defaultYearSl={defaultYearSl}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function HolidayFormBody({
  mode,
  holiday,
  yearOptions,
  defaultYearSl,
  errorMessage,
  onSubmit,
}: {
  mode: "create" | "edit";
  holiday: Holiday | null;
  yearOptions: YearOption[];
  defaultYearSl: string;
  errorMessage?: string | null;
  onSubmit: (input: HolidaySaveInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.holiday");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() =>
    toFormState(holiday, defaultYearSl),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const yearSl = Number(form.yearSl);
    const holiType = Number(form.holiType);

    const payload: HolidaySaveInput = {
      ...(mode === "edit" && holiday ? { id: holiday.id } : {}),
      yearSl: Number.isFinite(yearSl) ? yearSl : 0,
      holidayDate: form.holidayDate.trim(),
      purpose: form.purpose.trim(),
      holiType: Number.isFinite(holiType) ? holiType : undefined,
    };

    const parsed = holidaySaveInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        yearSl: flat.yearSl?.[0] ?? "",
        holidayDate: flat.holidayDate?.[0] ?? "",
        purpose: flat.purpose?.[0] ?? "",
        holiType: flat.holiType?.[0] ?? "",
      });
      return;
    }

    await onSubmit(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="holiday-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />

      <SelectField
        label={t("fields.year")}
        value={form.yearSl}
        required
        searchable
        placeholder={t("fields.yearPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.yearSl || undefined}
        onChange={(yearSl) => updateField("yearSl", yearSl)}
        options={yearOptions}
      />

      <DateField
        label={t("fields.holidayDate")}
        value={form.holidayDate}
        required
        error={fieldErrors.holidayDate || undefined}
        onChange={(value) => updateField("holidayDate", value)}
      />

      <TextField
        label={t("fields.purpose")}
        value={form.purpose}
        required
        maxLength={100}
        error={fieldErrors.purpose || undefined}
        onChange={(value) => updateField("purpose", value)}
      />

      <SelectField
        label={t("fields.holiType")}
        value={form.holiType}
        searchable={false}
        placeholder={t("fields.holiTypePlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.holiType || undefined}
        onChange={(holiType) => updateField("holiType", holiType)}
        options={[
          {
            value: String(HOLIDAY_TYPE_NATIONAL),
            label: t("types.national"),
          },
          {
            value: String(HOLIDAY_TYPE_FESTIVAL),
            label: t("types.festival"),
          },
        ]}
      />
    </form>
  );
}
