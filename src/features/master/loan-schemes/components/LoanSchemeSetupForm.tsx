"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Form";
import { fetchApplOptions } from "@/features/master/appl-options";
import type { ApplOption } from "@/features/master/appl-options";
import { fetchAcctLedgerList } from "@/features/master/acct-ledger";
import type { AcctLedger } from "@/features/master/acct-ledger/types/acct-ledger.types";
import {
  LOAN_CAPITALISATION_ON_OPT_GRP_ID,
  LOAN_INTT_TYPE_OPT_GRP_ID,
  LOAN_OVERDUE_ON_OPT_GRP_ID,
  LOAN_PRODUCT_TYPE_OPT_GRP_ID,
  LOAN_REPAY_SCHEDULE_OPT_GRP_ID,
  LOAN_REPAY_TYPE_OPT_GRP_ID,
} from "../constants";
import { loanSchemeSetupSaveInputSchema } from "../schemas/loan-schemes.schema";
import type {
  LoanSchemeSetup,
  LoanSchemeSetupSaveInput,
} from "../types/loan-schemes.types";

type LoanSchemeSetupFormProps = {
  open: boolean;
  mode: "create" | "edit";
  setup: LoanSchemeSetup | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: LoanSchemeSetupSaveInput) => Promise<void> | void;
};

type FormState = {
  schemeName: string;
  productTypeCd: string;
  repayTypeCd: string;
  roiPercent: string;
  inttTypeCd: string;
  repayScheduleCd: string;
  isInttCapitalisation: boolean;
  capitalisationOnCd: string;
  isIncentive: boolean;
  incentiveDay: string;
  incentiveRate: string;
  isOverdue: boolean;
  repayGraceDays: string;
  overdueOnCd: string;
  overdurRate: string;
  isNpa: boolean;
  npaAfterDays: string;
  isMortgageReqd: boolean;
  isGuarantorReqd: boolean;
  loanLedger: string;
  inttLedger: string;
  odinttLedger: string;
  fieldCollAllow: boolean;
  isActive: boolean;
};

type Option = { value: string; label: string };

function emptyForm(): FormState {
  return {
    schemeName: "",
    productTypeCd: "",
    repayTypeCd: "",
    roiPercent: "",
    inttTypeCd: "",
    repayScheduleCd: "",
    isInttCapitalisation: false,
    capitalisationOnCd: "",
    isIncentive: false,
    incentiveDay: "",
    incentiveRate: "",
    isOverdue: false,
    repayGraceDays: "",
    overdueOnCd: "",
    overdurRate: "",
    isNpa: false,
    npaAfterDays: "",
    isMortgageReqd: false,
    isGuarantorReqd: false,
    loanLedger: "",
    inttLedger: "",
    odinttLedger: "",
    fieldCollAllow: false,
    isActive: true,
  };
}

function toFormState(setup: LoanSchemeSetup | null): FormState {
  if (!setup) return emptyForm();
  return {
    schemeName: setup.schemeName,
    productTypeCd: setup.productTypeCd ? String(setup.productTypeCd) : "",
    repayTypeCd: setup.repayTypeCd ? String(setup.repayTypeCd) : "",
    roiPercent: String(setup.roiPercent),
    inttTypeCd: setup.inttTypeCd ? String(setup.inttTypeCd) : "",
    repayScheduleCd: setup.repayScheduleCd ? String(setup.repayScheduleCd) : "",
    isInttCapitalisation: setup.isInttCapitalisation,
    capitalisationOnCd: setup.capitalisationOnCd
      ? String(setup.capitalisationOnCd)
      : "",
    isIncentive: setup.isIncentive,
    incentiveDay: setup.incentiveDay != null ? String(setup.incentiveDay) : "",
    incentiveRate:
      setup.incentiveRate != null ? String(setup.incentiveRate) : "",
    isOverdue: setup.isOverdue,
    repayGraceDays:
      setup.repayGraceDays != null ? String(setup.repayGraceDays) : "",
    overdueOnCd: setup.overdueOnCd ? String(setup.overdueOnCd) : "",
    overdurRate: setup.overdurRate != null ? String(setup.overdurRate) : "",
    isNpa: setup.isNpa,
    npaAfterDays: setup.npaAfterDays != null ? String(setup.npaAfterDays) : "",
    isMortgageReqd: setup.isMortgageReqd,
    isGuarantorReqd: setup.isGuarantorReqd,
    loanLedger: setup.loanLedger != null ? String(setup.loanLedger) : "",
    inttLedger: setup.inttLedger != null ? String(setup.inttLedger) : "",
    odinttLedger: setup.odinttLedger != null ? String(setup.odinttLedger) : "",
    fieldCollAllow: setup.fieldCollAllow,
    isActive: setup.isActive,
  };
}

function readNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function LoanSchemeSetupForm({
  open,
  mode,
  setup,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}: LoanSchemeSetupFormProps) {
  const t = useTranslations("master.loanSchemes.setup");
  const formKey = mode === "edit" ? `edit-${setup?.id ?? 0}` : "create";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("createTitle") : t("editTitle")}
      size="lg"
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
            form="loan-scheme-setup-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <LoanSchemeSetupFormBody
        key={formKey}
        mode={mode}
        setup={setup}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

function LoanSchemeSetupFormBody({
  mode,
  setup,
  errorMessage,
  onSubmit,
}: {
  mode: "create" | "edit";
  setup: LoanSchemeSetup | null;
  errorMessage?: string | null;
  onSubmit: (input: LoanSchemeSetupSaveInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.loanSchemes.setup");
  const tUi = useTranslations("ui");
  const tErrors = useTranslations("errors");

  const [form, setForm] = useState<FormState>(() => toFormState(setup));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<ApplOption[]>([]);
  const [repayTypes, setRepayTypes] = useState<ApplOption[]>([]);
  const [inttTypes, setInttTypes] = useState<ApplOption[]>([]);
  const [schedules, setSchedules] = useState<ApplOption[]>([]);
  const [capitalisationOn, setCapitalisationOn] = useState<ApplOption[]>([]);
  const [overdueOn, setOverdueOn] = useState<ApplOption[]>([]);
  const [ledgers, setLedgers] = useState<AcctLedger[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [products, repays, interests, schedule, capital, overdue, ledgerItems] =
          await Promise.all([
            fetchApplOptions(LOAN_PRODUCT_TYPE_OPT_GRP_ID),
            fetchApplOptions(LOAN_REPAY_TYPE_OPT_GRP_ID),
            fetchApplOptions(LOAN_INTT_TYPE_OPT_GRP_ID),
            fetchApplOptions(LOAN_REPAY_SCHEDULE_OPT_GRP_ID),
            fetchApplOptions(LOAN_CAPITALISATION_ON_OPT_GRP_ID),
            fetchApplOptions(LOAN_OVERDUE_ON_OPT_GRP_ID),
            loadActiveLedgers(),
          ]);
        if (cancelled) return;
        setProductTypes(products);
        setRepayTypes(repays);
        setInttTypes(interests);
        setSchedules(schedule);
        setCapitalisationOn(capital);
        setOverdueOn(overdue);
        setLedgers(ledgerItems);
      } catch {
        if (!cancelled) setOptionsError(tErrors("generic"));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tErrors]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function updateFlag(
    key: "isInttCapitalisation" | "isIncentive" | "isOverdue" | "isNpa",
    checked: boolean,
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: checked };
      if (!checked && key === "isInttCapitalisation") {
        next.capitalisationOnCd = "";
      }
      if (!checked && key === "isIncentive") {
        next.incentiveDay = "";
        next.incentiveRate = "";
      }
      if (!checked && key === "isOverdue") {
        next.repayGraceDays = "";
        next.overdueOnCd = "";
        next.overdurRate = "";
      }
      if (!checked && key === "isNpa") {
        next.npaAfterDays = "";
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = loanSchemeSetupSaveInputSchema.safeParse({
      ...(mode === "edit" && setup ? { schemeId: setup.id } : {}),
      schemeName: form.schemeName.trim(),
      productTypeCd: readNumber(form.productTypeCd),
      repayTypeCd: readNumber(form.repayTypeCd),
      roiPercent: readNumber(form.roiPercent),
      inttTypeCd: readNumber(form.inttTypeCd),
      repayScheduleCd: readNumber(form.repayScheduleCd),
      isInttCapitalisation: form.isInttCapitalisation,
      capitalisationOnCd: readNumber(form.capitalisationOnCd),
      isIncentive: form.isIncentive,
      incentiveDay: readNumber(form.incentiveDay),
      incentiveRate: readNumber(form.incentiveRate),
      isOverdue: form.isOverdue,
      repayGraceDays: readNumber(form.repayGraceDays),
      overdueOnCd: readNumber(form.overdueOnCd),
      overdurRate: readNumber(form.overdurRate),
      isNpa: form.isNpa,
      npaAfterDays: readNumber(form.npaAfterDays),
      isMortgageReqd: form.isMortgageReqd,
      isGuarantorReqd: form.isGuarantorReqd,
      loanLedger: readNumber(form.loanLedger),
      inttLedger: readNumber(form.inttLedger),
      odinttLedger: readNumber(form.odinttLedger),
      fieldCollAllow: form.fieldCollAllow,
      isActive: form.isActive,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const message = (key: string) =>
        flat[key as keyof typeof flat]?.length ? t(`errors.${key}`) : "";
      const sameLedgers =
        Boolean(form.loanLedger) &&
        ((form.inttLedger && form.loanLedger === form.inttLedger) ||
          (form.odinttLedger &&
            (form.odinttLedger === form.loanLedger ||
              form.odinttLedger === form.inttLedger)));
      setFieldErrors({
        schemeName: message("schemeName"),
        productTypeCd: message("productTypeCd"),
        repayTypeCd: message("repayTypeCd"),
        roiPercent: message("roiPercent"),
        inttTypeCd: message("inttTypeCd"),
        repayScheduleCd: message("repayScheduleCd"),
        capitalisationOnCd: message("capitalisationOnCd"),
        incentiveDay: message("incentiveDay"),
        incentiveRate: message("incentiveRate"),
        overdueOnCd: message("overdueOnCd"),
        overdurRate: message("overdurRate"),
        repayGraceDays: message("repayGraceDays"),
        npaAfterDays: message("npaAfterDays"),
        inttLedger: flat.inttLedger?.length
          ? sameLedgers
            ? t("errors.sameLedgers")
            : t("errors.inttLedger")
          : "",
        odinttLedger: flat.odinttLedger?.length ? t("errors.sameLedgers") : "",
      });
      return;
    }

    await onSubmit(parsed.data);
  }

  const productOptions = useMemo(
    () =>
      withCurrent(toSelectOptions(productTypes), form.productTypeCd, setup?.productTypeDesc),
    [form.productTypeCd, productTypes, setup?.productTypeDesc],
  );
  const repayOptions = useMemo(
    () => withCurrent(toSelectOptions(repayTypes), form.repayTypeCd, setup?.repayTypeDesc),
    [form.repayTypeCd, repayTypes, setup?.repayTypeDesc],
  );
  const inttOptions = useMemo(
    () => withCurrent(toSelectOptions(inttTypes), form.inttTypeCd, setup?.inttTypeDesc),
    [form.inttTypeCd, inttTypes, setup?.inttTypeDesc],
  );
  const scheduleOptions = useMemo(
    () =>
      withCurrent(
        toSelectOptions(schedules),
        form.repayScheduleCd,
        setup?.repayScheduleDesc,
      ),
    [form.repayScheduleCd, schedules, setup?.repayScheduleDesc],
  );
  const capitalOptions = useMemo(
    () =>
      withCurrent(
        toSelectOptions(capitalisationOn),
        form.capitalisationOnCd,
        setup?.capitalisationOnDesc,
      ),
    [capitalisationOn, form.capitalisationOnCd, setup?.capitalisationOnDesc],
  );
  const overdueOptions = useMemo(
    () =>
      withCurrent(toSelectOptions(overdueOn), form.overdueOnCd, setup?.overdueOnDesc),
    [form.overdueOnCd, overdueOn, setup?.overdueOnDesc],
  );

  const ledgerOptions = useMemo(() => {
    const options: Option[] = [
      { value: "", label: t("placeholders.none") },
      ...ledgers.map((ledger) => ({
        value: String(ledger.ledgerId),
        label: `${ledger.ledgerName} (${ledger.ledgerCode})`,
      })),
    ];
    return ensureLedgers(options, setup);
  }, [ledgers, setup, t]);

  const selectProps = {
    searchPlaceholder: tUi("selectSearch"),
    emptyMessage: tUi("selectEmpty"),
  };

  return (
    <form autoComplete="off"
      id="loan-scheme-setup-form"
      className="space-y-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <PageToast message={errorMessage ?? optionsError} tone="error" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mode === "edit" && setup?.schemeCode ? (
          <TextField
            label={t("fields.schemeCode")}
            value={setup.schemeCode}
            readOnly
            onChange={() => undefined}
          />
        ) : null}
        <TextField
          label={t("fields.schemeName")}
          value={form.schemeName}
          required
          maxLength={150}
          error={fieldErrors.schemeName || undefined}
          onChange={(value) => updateField("schemeName", value)}
        />
        <SelectField
          label={t("fields.productType")}
          value={form.productTypeCd}
          required
          placeholder={t("placeholders.select")}
          error={fieldErrors.productTypeCd || undefined}
          options={productOptions}
          onChange={(value) => updateField("productTypeCd", value)}
          {...selectProps}
        />
        <SelectField
          label={t("fields.repayType")}
          value={form.repayTypeCd}
          required
          placeholder={t("placeholders.select")}
          error={fieldErrors.repayTypeCd || undefined}
          options={repayOptions}
          onChange={(value) => updateField("repayTypeCd", value)}
          {...selectProps}
        />
        <TextField
          label={t("fields.roiPercent")}
          value={form.roiPercent}
          required
          type="number"
          step="0.01"
          min={0}
          max={100}
          error={fieldErrors.roiPercent || undefined}
          onChange={(value) => updateField("roiPercent", value)}
        />
        <SelectField
          label={t("fields.inttType")}
          value={form.inttTypeCd}
          required
          placeholder={t("placeholders.select")}
          error={fieldErrors.inttTypeCd || undefined}
          options={inttOptions}
          onChange={(value) => updateField("inttTypeCd", value)}
          {...selectProps}
        />
        <SelectField
          label={t("fields.repaySchedule")}
          value={form.repayScheduleCd}
          required
          placeholder={t("placeholders.select")}
          error={fieldErrors.repayScheduleCd || undefined}
          options={scheduleOptions}
          onChange={(value) => updateField("repayScheduleCd", value)}
          {...selectProps}
        />
      </div>

      <FlagSection title={t("sections.capitalisation")}>
        <CheckboxField
          label={t("fields.isInttCapitalisation")}
          checked={form.isInttCapitalisation}
          onChange={(checked) => updateFlag("isInttCapitalisation", checked)}
        />
        {form.isInttCapitalisation ? (
          <SelectField
            label={t("fields.capitalisationOn")}
            value={form.capitalisationOnCd}
            required
            placeholder={t("placeholders.select")}
            error={fieldErrors.capitalisationOnCd || undefined}
            options={capitalOptions}
            onChange={(value) => updateField("capitalisationOnCd", value)}
            {...selectProps}
          />
        ) : null}
      </FlagSection>

      <FlagSection title={t("sections.incentive")}>
        <CheckboxField
          label={t("fields.isIncentive")}
          checked={form.isIncentive}
          onChange={(checked) => updateFlag("isIncentive", checked)}
        />
        {form.isIncentive ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label={t("fields.incentiveDay")}
              value={form.incentiveDay}
              required
              type="number"
              min={1}
              max={127}
              error={fieldErrors.incentiveDay || undefined}
              onChange={(value) => updateField("incentiveDay", value)}
            />
            <TextField
              label={t("fields.incentiveRate")}
              value={form.incentiveRate}
              required
              type="number"
              step="0.01"
              min={0}
              max={100}
              error={fieldErrors.incentiveRate || undefined}
              onChange={(value) => updateField("incentiveRate", value)}
            />
          </div>
        ) : null}
      </FlagSection>

      <FlagSection title={t("sections.overdue")}>
        <CheckboxField
          label={t("fields.isOverdue")}
          checked={form.isOverdue}
          onChange={(checked) => updateFlag("isOverdue", checked)}
        />
        {form.isOverdue ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label={t("fields.overdueOn")}
              value={form.overdueOnCd}
              required
              placeholder={t("placeholders.select")}
              error={fieldErrors.overdueOnCd || undefined}
              options={overdueOptions}
              onChange={(value) => updateField("overdueOnCd", value)}
              {...selectProps}
            />
            <TextField
              label={t("fields.overdurRate")}
              value={form.overdurRate}
              required
              type="number"
              step="0.01"
              min={0}
              max={100}
              error={fieldErrors.overdurRate || undefined}
              onChange={(value) => updateField("overdurRate", value)}
            />
            <TextField
              label={t("fields.repayGraceDays")}
              value={form.repayGraceDays}
              type="number"
              min={0}
              error={fieldErrors.repayGraceDays || undefined}
              onChange={(value) => updateField("repayGraceDays", value)}
            />
          </div>
        ) : null}
      </FlagSection>

      <FlagSection title={t("sections.npa")}>
        <CheckboxField
          label={t("fields.isNpa")}
          checked={form.isNpa}
          onChange={(checked) => updateFlag("isNpa", checked)}
        />
        {form.isNpa ? (
          <TextField
            label={t("fields.npaAfterDays")}
            value={form.npaAfterDays}
            required
            type="number"
            min={1}
            error={fieldErrors.npaAfterDays || undefined}
            onChange={(value) => updateField("npaAfterDays", value)}
          />
        ) : null}
      </FlagSection>

      <FlagSection title={t("sections.ledgers")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label={t("fields.loanLedger")}
            value={form.loanLedger}
            placeholder={t("placeholders.none")}
            options={ledgerOptions}
            onChange={(value) => updateField("loanLedger", value)}
            {...selectProps}
          />
          <SelectField
            label={t("fields.inttLedger")}
            value={form.inttLedger}
            placeholder={t("placeholders.none")}
            error={fieldErrors.inttLedger || undefined}
            options={ledgerOptions}
            onChange={(value) => updateField("inttLedger", value)}
            {...selectProps}
          />
          <SelectField
            label={t("fields.odinttLedger")}
            value={form.odinttLedger}
            placeholder={t("placeholders.none")}
            error={fieldErrors.odinttLedger || undefined}
            options={ledgerOptions}
            onChange={(value) => updateField("odinttLedger", value)}
            {...selectProps}
          />
        </div>
      </FlagSection>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CheckboxField
          label={t("fields.isMortgageReqd")}
          checked={form.isMortgageReqd}
          onChange={(checked) => updateField("isMortgageReqd", checked)}
        />
        <CheckboxField
          label={t("fields.isGuarantorReqd")}
          checked={form.isGuarantorReqd}
          onChange={(checked) => updateField("isGuarantorReqd", checked)}
        />
        <CheckboxField
          label={t("fields.fieldCollAllow")}
          checked={form.fieldCollAllow}
          onChange={(checked) => updateField("fieldCollAllow", checked)}
        />
        <CheckboxField
          label={t("fields.isActive")}
          checked={form.isActive}
          onChange={(checked) => updateField("isActive", checked)}
        />
      </div>
    </form>
  );
}

function FlagSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border p-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

async function loadActiveLedgers(): Promise<AcctLedger[]> {
  const items: AcctLedger[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await fetchAcctLedgerList({
      isActive: 1,
      page,
      perPage: 200,
    });
    items.push(...result.items);
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage && page <= 10);
  return items;
}

function toSelectOptions(items: ApplOption[]): Option[] {
  return items.map((item) => ({
    value: String(item.optCode),
    label: item.optDescription,
  }));
}

function withCurrent(options: Option[], code: string, label?: string): Option[] {
  if (!code || options.some((option) => option.value === code)) return options;
  return [...options, { value: code, label: label || code }];
}

function ensureLedgers(options: Option[], setup: LoanSchemeSetup | null): Option[] {
  if (!setup) return options;
  const extras: Option[] = [];
  const known = new Set(options.map((option) => option.value));
  const add = (id: number | null, name: string | null, code: string | null) => {
    if (id == null) return;
    const value = String(id);
    if (known.has(value)) return;
    known.add(value);
    extras.push({
      value,
      label: name ? (code ? `${name} (${code})` : name) : value,
    });
  };
  add(setup.loanLedger, setup.loanLedgerName, setup.loanLedgerCode);
  add(setup.inttLedger, setup.inttLedgerName, setup.inttLedgerCode);
  add(setup.odinttLedger, setup.odinttLedgerName, setup.odinttLedgerCode);
  return extras.length > 0 ? [...options, ...extras] : options;
}
