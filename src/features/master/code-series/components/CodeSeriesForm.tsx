"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Form";
import { codeSeriesUpdateInputSchema } from "@/features/master/code-series/schemas/code-series.schema";
import type {
  CodeSeries,
  CodeSeriesUpdateInput,
} from "@/features/master/code-series/types/code-series.types";

type CodeSeriesFormProps = {
  open: boolean;
  series: CodeSeries | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: CodeSeriesUpdateInput) => Promise<void> | void;
};

type FormState = {
  prefix: string;
  nextCounter: number;
  paddingDigits: number;
  suffix: string;
  status: number;
};

function toFormState(series: CodeSeries): FormState {
  return {
    prefix: series.prefix,
    nextCounter: series.nextCounter,
    paddingDigits: series.paddingDigits,
    suffix: series.suffix,
    status: series.status,
  };
}

type FormBodyProps = {
  series: CodeSeries;
  errorMessage?: string | null;
  onSubmit: (input: CodeSeriesUpdateInput) => Promise<void> | void;
};

function CodeSeriesFormBody({
  series,
  errorMessage,
  onSubmit,
}: FormBodyProps) {
  const t = useTranslations("master.codeSeries");
  const [form, setForm] = useState<FormState>(() => toFormState(series));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CodeSeriesUpdateInput = {
      seriesId: series.seriesId,
      nextCounter: form.nextCounter,
      paddingDigits: form.paddingDigits,
      prefix: form.prefix,
      suffix: form.suffix,
      status: form.status,
    };

    const parsed = codeSeriesUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flat)) {
        if (messages?.[0]) next[key] = messages[0];
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    await onSubmit(parsed.data);
  }

  return (
    <form
      id="code-series-form"
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

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("fields.moduleName")}
          value={series.moduleName}
          readOnly
        />
        <TextField
          label={t("fields.moduleKey")}
          value={series.moduleKey}
          readOnly
          inputClassName="font-mono"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("fields.prefix")}
          value={form.prefix}
          maxLength={50}
          error={fieldErrors.prefix}
          onChange={(value) => setForm((prev) => ({ ...prev, prefix: value }))}
        />
        <TextField
          label={t("fields.suffix")}
          value={form.suffix}
          onChange={(value) => setForm((prev) => ({ ...prev, suffix: value }))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("fields.nextCounter")}
          type="number"
          min={1}
          required
          value={form.nextCounter}
          error={fieldErrors.nextCounter}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              nextCounter: Number(value) || 0,
            }))
          }
        />
        <TextField
          label={t("fields.paddingDigits")}
          type="number"
          min={1}
          max={12}
          required
          value={form.paddingDigits}
          error={fieldErrors.paddingDigits}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              paddingDigits: Number(value) || 0,
            }))
          }
        />
      </div>

      <SelectField
        label={t("fields.status")}
        value={String(form.status)}
        onChange={(value) =>
          setForm((prev) => ({ ...prev, status: Number(value) }))
        }
        options={[
          { value: "1", label: t("statusActive") },
          { value: "0", label: t("statusInactive") },
        ]}
      />

      <p className="text-xs text-muted">
        {t("sampleHint", { sample: series.formattedSample })}
      </p>
    </form>
  );
}

export function CodeSeriesForm({
  open,
  series,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: CodeSeriesFormProps) {
  const t = useTranslations("master.codeSeries");

  return (
    <Modal
      open={open && Boolean(series)}
      onClose={onClose}
      title={t("formTitle")}
      subtitle={
        series
          ? `${series.moduleName} · ${series.moduleKey}`
          : undefined
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="code-series-form"
            icon={Save}
            disabled={saving || !series}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      {series ? (
        <CodeSeriesFormBody
          key={series.seriesId}
          series={series}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}
