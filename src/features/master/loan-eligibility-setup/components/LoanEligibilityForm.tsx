"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import {
  CheckboxField,
  DateField,
  SelectField,
  TextField,
} from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import type { ApplOption } from "@/features/master/appl-options";
import {
  LOAN_ELIGIBILITY_TERM_OPT_GRP_ID,
  isLoanEligibilityDataType,
} from "../constants";
import { loanEligibilitySaveInputSchema } from "../schemas/loan-eligibility.schema";
import type {
  LoanEligibilityParameter,
  LoanEligibilitySaveInput,
} from "../types/loan-eligibility.types";

type LoanEligibilityFormProps = {
  parameter: LoanEligibilityParameter;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: LoanEligibilitySaveInput) => Promise<void> | void;
};

type FormState = {
  reqValue: string;
  valueCd: string;
  parameterValue: string;
  isMandatory: boolean;
  effectiveFrom: string;
  isActive: boolean;
};

function createFormState(parameter: LoanEligibilityParameter): FormState {
  return {
    reqValue: parameter.reqValue == null ? "" : String(parameter.reqValue),
    valueCd: parameter.valueCd == null ? "" : String(parameter.valueCd),
    parameterValue: parameter.parameterValue,
    isMandatory: parameter.isMandatory,
    effectiveFrom: parameter.effectiveFrom ?? "",
    isActive: parameter.isActive,
  };
}

function readNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function usesNumericValue(dataType: string): boolean {
  return (
    dataType === "NUMBER" ||
    dataType === "AMOUNT" ||
    dataType === "PERCENTAGE" ||
    dataType === "BOOLEAN"
  );
}

export function LoanEligibilityForm({
  parameter,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: LoanEligibilityFormProps) {
  const t = useTranslations("master.loanEligibility");

  return (
    <Modal
      open
      onClose={onClose}
      title={t("editTitle")}
      subtitle={parameter.parameterName}
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
            form="loan-eligibility-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <LoanEligibilityFormBody
        parameter={parameter}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function LoanEligibilityFormBody({
  parameter,
  errorMessage,
  onSubmit,
}: {
  parameter: LoanEligibilityParameter;
  errorMessage?: string | null;
  onSubmit: (input: LoanEligibilitySaveInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.loanEligibility");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() => createFormState(parameter));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [termOptions, setTermOptions] = useState<ApplOption[]>([]);
  const dataType = parameter.dataType;

  useEffect(() => {
    if (dataType !== "NUMBER") return;
    let cancelled = false;
    async function loadTerms() {
      try {
        const options = await fetchApplOptions(LOAN_ELIGIBILITY_TERM_OPT_GRP_ID);
        if (!cancelled) setTermOptions(options);
      } catch {
        if (!cancelled) setTermOptions([]);
      }
    }
    void loadTerms();
    return () => {
      cancelled = true;
    };
  }, [dataType]);

  const unitOptions = useMemo(() => {
    const visible = termOptions.filter(
      (option) => option.isActive || String(option.optCode) === form.valueCd,
    );
    const options = visible.map((option) => ({
      value: String(option.optCode),
      label: option.optDescription,
    }));
    if (
      parameter.valueCd != null &&
      !options.some((option) => option.value === String(parameter.valueCd))
    ) {
      options.unshift({
        value: String(parameter.valueCd),
        label: parameter.valueDesc || String(parameter.valueCd),
      });
    }
    return [{ value: "", label: t("fields.valueCdNone") }, ...options];
  }, [form.valueCd, parameter.valueCd, parameter.valueDesc, t, termOptions]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const numeric = usesNumericValue(dataType);
    const parsed = loanEligibilitySaveInputSchema.safeParse({
      paramId: parameter.paramId,
      dataType,
      operator: parameter.operator,
      reqValue: numeric ? readNumber(form.reqValue) : null,
      valueCd:
        dataType === "NUMBER"
          ? form.valueCd
            ? readNumber(form.valueCd)
            : null
          : null,
      parameterValue:
        dataType === "TEXT" || dataType === "DATE" ? form.parameterValue : null,
      isMandatory: form.isMandatory,
      effectiveFrom: form.effectiveFrom.trim() ? form.effectiveFrom : null,
      isActive: form.isActive,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const message = (key: string) =>
        flat[key as keyof typeof flat]?.length ? t(`errors.${key}`) : "";
      setFieldErrors({
        operator: message("operator"),
        reqValue: message("reqValue"),
        valueCd: message("valueCd"),
        parameterValue: message("parameterValue"),
        effectiveFrom: message("effectiveFrom"),
      });
      return;
    }

    await onSubmit(parsed.data);
  }

  const dataTypeLabel = isLoanEligibilityDataType(dataType)
    ? t(`dataTypes.${dataType}`)
    : dataType;

  return (
    <form autoComplete="off"
      id="loan-eligibility-form"
      className="space-y-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />
      <p className="text-sm text-muted">{t("readOnlyHint")}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label={t("fields.parameterName")}
          value={parameter.parameterName}
          readOnly
          onChange={() => undefined}
        />
        <TextField
          label={t("fields.dataType")}
          value={dataTypeLabel}
          readOnly
          onChange={() => undefined}
        />
        <TextField
          label={t("fields.operator")}
          value={parameter.operator}
          readOnly
          error={fieldErrors.operator || undefined}
          onChange={() => undefined}
        />

        {dataType === "BOOLEAN" ? (
          <SelectField
            label={t("fields.reqValue")}
            value={form.reqValue}
            required
            searchable={false}
            error={fieldErrors.reqValue || undefined}
            onChange={(reqValue) => updateField("reqValue", reqValue)}
            options={[
              { value: "1", label: t("yes") },
              { value: "0", label: t("no") },
            ]}
          />
        ) : null}

        {dataType === "NUMBER" || dataType === "AMOUNT" || dataType === "PERCENTAGE" ? (
          <TextField
            label={t("fields.reqValue")}
            value={form.reqValue}
            required
            inputMode="decimal"
            hint={dataType === "PERCENTAGE" ? t("fields.percentHint") : undefined}
            error={fieldErrors.reqValue || undefined}
            onChange={(value) => updateField("reqValue", value)}
          />
        ) : null}

        {dataType === "NUMBER" ? (
          <SelectField
            label={t("fields.valueCd")}
            value={form.valueCd}
            placeholder={t("fields.valueCdNone")}
            searchPlaceholder={tUi("selectSearch")}
            emptyMessage={tUi("selectEmpty")}
            error={fieldErrors.valueCd || undefined}
            onChange={(valueCd) => updateField("valueCd", valueCd)}
            options={unitOptions}
          />
        ) : null}

        {dataType === "TEXT" ? (
          <TextField
            label={t("fields.parameterValue")}
            value={form.parameterValue}
            required
            maxLength={500}
            error={fieldErrors.parameterValue || undefined}
            onChange={(value) => updateField("parameterValue", value)}
          />
        ) : null}

        {dataType === "DATE" ? (
          <DateField
            label={t("fields.parameterValue")}
            value={form.parameterValue}
            required
            error={fieldErrors.parameterValue || undefined}
            onChange={(value) => updateField("parameterValue", value)}
          />
        ) : null}

        {dataType !== "TEXT" && dataType !== "DATE" ? (
          <TextField
            label={t("fields.parameterValue")}
            value={parameter.parameterValue}
            readOnly
            hint={t("fields.parameterValueHint")}
            onChange={() => undefined}
          />
        ) : null}

        <DateField
          label={t("fields.effectiveFrom")}
          value={form.effectiveFrom}
          hint={t("fields.effectiveFromHint")}
          error={fieldErrors.effectiveFrom || undefined}
          onChange={(effectiveFrom) => updateField("effectiveFrom", effectiveFrom)}
        />
        <div className="flex flex-col justify-end gap-3 pb-2">
          <CheckboxField
            label={t("fields.isMandatory")}
            checked={form.isMandatory}
            onChange={(isMandatory) => updateField("isMandatory", isMandatory)}
          />
          <CheckboxField
            label={t("fields.isActive")}
            checked={form.isActive}
            onChange={(isActive) => updateField("isActive", isActive)}
          />
        </div>
      </div>
    </form>
  );
}
