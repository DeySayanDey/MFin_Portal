"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Card } from "@/components/ui/Card";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Form";
import {
  DEFAULT_LANGUAGE_OPTIONS,
  type DefaultLanguage,
} from "@/features/master/global-settings/types/global-settings.types";

type FlagKey =
  | "allowBackdatedTxn"
  | "dayEndRequired"
  | "monthEndRequired"
  | "yearEndRequired"
  | "panRequired"
  | "aadhaarRequired"
  | "voterIdRequired"
  | "geoTaggingRequired";

type HintedFlagKey = Exclude<FlagKey, "allowBackdatedTxn">;

type FormState = Record<FlagKey, boolean> & {
  defaultLanguage: DefaultLanguage;
  passwordExpiryDays: string;
  loginAttemptLimit: string;
  maxBackdateDays: string;
};

type NumberField = "passwordExpiryDays" | "loginAttemptLimit" | "maxBackdateDays";
type FieldErrors = Partial<Record<NumberField, string>>;

const SAMPLE_SETTINGS: FormState = {
  defaultLanguage: "en",
  passwordExpiryDays: "90",
  loginAttemptLimit: "5",
  allowBackdatedTxn: true,
  maxBackdateDays: "7",
  dayEndRequired: true,
  monthEndRequired: true,
  yearEndRequired: true,
  panRequired: false,
  aadhaarRequired: true,
  voterIdRequired: false,
  geoTaggingRequired: true,
};

const SAMPLE_UPDATED_BY = "Head Office Admin";
const SAMPLE_UPDATED_AT = new Date("2026-10-28T16:35:00+05:30");

const RANGES: Record<NumberField, { min: number; max: number }> = {
  passwordExpiryDays: { min: 0, max: 365 },
  loginAttemptLimit: { min: 1, max: 20 },
  maxBackdateDays: { min: 1, max: 365 },
};

const PERIOD_FLAGS: HintedFlagKey[] = ["dayEndRequired", "monthEndRequired", "yearEndRequired"];
const KYC_FLAGS: HintedFlagKey[] = ["panRequired", "aadhaarRequired", "voterIdRequired", "geoTaggingRequired"];

function parseWholeNumber(raw: string): number {
  if (!/^\d+$/.test(raw.trim())) return Number.NaN;
  return Number(raw.trim());
}

function outOfRange(field: NumberField, raw: string): boolean {
  const value = parseWholeNumber(raw);
  const { min, max } = RANGES[field];
  return Number.isNaN(value) || value < min || value > max;
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function FlagField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <CheckboxField label={label} checked={checked} onChange={onChange} />
      <p className="mt-1 ps-6 text-xs text-muted">{hint}</p>
    </div>
  );
}

export function GlobalSettingsForm() {
  const t = useTranslations("master.globalSettings");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [saved, setSaved] = useState<FormState>(SAMPLE_SETTINGS);
  const [form, setForm] = useState<FormState>(SAMPLE_SETTINGS);
  const [updatedAt, setUpdatedAt] = useState<Date>(SAMPLE_UPDATED_AT);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useToastText();
  const [successMessage, setSuccessMessage] = useToastText();

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const languageOptions = DEFAULT_LANGUAGE_OPTIONS.map((value) => ({
    value,
    label: t(`options.language.${value}`),
  }));

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): FieldErrors {
    const fields: NumberField[] = ["passwordExpiryDays", "loginAttemptLimit"];
    if (form.allowBackdatedTxn) fields.push("maxBackdateDays");
    const errors: FieldErrors = {};
    for (const field of fields) {
      if (outOfRange(field, form[field])) errors[field] = t("rangeError", RANGES[field]);
    }
    return errors;
  }

  function handleReset() {
    setForm(saved);
    setFieldErrors({});
    setFormError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(t("validationFailed"));
      return;
    }

    const next = { ...form, maxBackdateDays: form.allowBackdatedTxn ? form.maxBackdateDays : "0" };
    setFormError(null);
    setForm(next);
    setSaved(next);
    setUpdatedAt(new Date());
    setSuccessMessage(t("saveSuccess"));
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={successMessage} />

      <Card title={t("title")} description={t("description")}>
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <PageToast message={formError} tone="error" />

          <form autoComplete="off" id="global-settings-form" onSubmit={handleSubmit} noValidate>
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
              <Section title={t("sections.general.title")} hint={t("sections.general.hint")}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <SelectField
                    label={t("fields.defaultLanguage")}
                    value={form.defaultLanguage}
                    required
                    searchable={false}
                    options={languageOptions}
                    onChange={(value) => updateField("defaultLanguage", value as DefaultLanguage)}
                  />
                  <TextField
                    label={t("fields.passwordExpiryDays")}
                    value={form.passwordExpiryDays}
                    required
                    inputMode="numeric"
                    restrict="digits"
                    hint={t("hints.passwordExpiryDays")}
                    error={fieldErrors.passwordExpiryDays}
                    onChange={(value) => updateField("passwordExpiryDays", value)}
                  />
                  <TextField
                    label={t("fields.loginAttemptLimit")}
                    value={form.loginAttemptLimit}
                    required
                    inputMode="numeric"
                    restrict="digits"
                    hint={t("hints.loginAttemptLimit")}
                    error={fieldErrors.loginAttemptLimit}
                    onChange={(value) => updateField("loginAttemptLimit", value)}
                  />
                </div>
              </Section>

              <Section title={t("sections.transactions.title")} hint={t("sections.transactions.hint")}>
                <CheckboxField
                  label={t("fields.allowBackdatedTxn")}
                  checked={form.allowBackdatedTxn}
                  onChange={(checked) => {
                    updateField("allowBackdatedTxn", checked);
                    if (!checked) updateField("maxBackdateDays", "0");
                    else if (outOfRange("maxBackdateDays", form.maxBackdateDays)) updateField("maxBackdateDays", "7");
                  }}
                />
                <div className="mt-3 max-w-md">
                  <TextField
                    label={t("fields.maxBackdateDays")}
                    value={form.maxBackdateDays}
                    required={form.allowBackdatedTxn}
                    inputMode="numeric"
                    restrict="digits"
                    disabled={!form.allowBackdatedTxn}
                    hint={t("hints.maxBackdateDays")}
                    error={fieldErrors.maxBackdateDays}
                    onChange={(value) => updateField("maxBackdateDays", value)}
                  />
                </div>
              </Section>

              <Section title={t("sections.closing.title")} hint={t("sections.closing.hint")}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {PERIOD_FLAGS.map((key) => (
                    <FlagField
                      key={key}
                      label={t(`fields.${key}`)}
                      hint={t(`flagHints.${key}`)}
                      checked={form[key]}
                      onChange={(checked) => updateField(key, checked)}
                    />
                  ))}
                </div>
              </Section>

              <Section title={t("sections.kyc.title")} hint={t("sections.kyc.hint")}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {KYC_FLAGS.map((key) => (
                    <FlagField
                      key={key}
                      label={t(`fields.${key}`)}
                      hint={t(`flagHints.${key}`)}
                      checked={form[key]}
                      onChange={(checked) => updateField(key, checked)}
                    />
                  ))}
                </div>
              </Section>

              <div className="btn-actions flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted">
                  {t("lastUpdated", {
                    name: SAMPLE_UPDATED_BY,
                    date: format.dateTime(updatedAt, { dateStyle: "medium", timeStyle: "short" }),
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="secondary" icon={RotateCcw} disabled={!dirty} onClick={handleReset}>
                    {tCommon("reset")}
                  </Button>
                  <Button type="submit" icon={Save} disabled={!dirty}>
                    {t("save")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
