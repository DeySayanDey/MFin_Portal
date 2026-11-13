"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Form";
import {
  acctLedgerCreateInputSchema,
  acctLedgerUpdateInputSchema,
} from "@/features/master/acct-ledger/schemas/acct-ledger.schema";
import type {
  AcctLedger,
  AcctLedgerCreateInput,
  AcctLedgerUpdateInput,
} from "@/features/master/acct-ledger/types/acct-ledger.types";
import type { AcctLedgerMainHeadOption } from "@/features/master/acct-ledger/components/AcctLedgerFilters";

type AcctLedgerFormProps = {
  open: boolean;
  mode: "create" | "edit";
  ledger: AcctLedger | null;
  mainHeads: AcctLedgerMainHeadOption[];
  ledgerTypes: AcctLedgerMainHeadOption[];
  ledgerTypesError: boolean;
  cashLedgerIds: number[];
  cashCheckLoading: boolean;
  cashCheckError: boolean;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onCreate: (input: AcctLedgerCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctLedgerUpdateInput) => Promise<void> | void;
};

type FormState = {
  ledgerName: string;
  ledgerType: string;
  mainhdId: string;
  isActive: boolean;
};

function toFormState(ledger: AcctLedger | null): FormState {
  if (!ledger) {
    return {
      ledgerName: "",
      ledgerType: "",
      mainhdId: "",
      isActive: true,
    };
  }
  return {
    ledgerName: ledger.ledgerName,
    ledgerType: ledger.ledgerType ?? "",
    mainhdId: String(ledger.mainhdId),
    isActive: ledger.isActive,
  };
}

export function AcctLedgerForm({
  open,
  mode,
  ledger,
  mainHeads,
  ledgerTypes,
  ledgerTypesError,
  cashLedgerIds,
  cashCheckLoading,
  cashCheckError,
  saving,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: AcctLedgerFormProps) {
  const t = useTranslations("master.acctLedger");
  const formKey =
    mode === "edit" ? `edit-${ledger?.ledgerId ?? 0}` : "create";

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
            form="acct-ledger-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <AcctLedgerFormBody
        key={formKey}
        mode={mode}
        ledger={ledger}
        mainHeads={mainHeads}
        ledgerTypes={ledgerTypes}
        ledgerTypesError={ledgerTypesError}
        cashLedgerIds={cashLedgerIds}
        cashCheckLoading={cashCheckLoading}
        cashCheckError={cashCheckError}
        errorMessage={errorMessage}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </Modal>
  );
}

function AcctLedgerFormBody({
  mode,
  ledger,
  mainHeads,
  ledgerTypes,
  ledgerTypesError,
  cashLedgerIds,
  cashCheckLoading,
  cashCheckError,
  errorMessage,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  ledger: AcctLedger | null;
  mainHeads: AcctLedgerMainHeadOption[];
  ledgerTypes: AcctLedgerMainHeadOption[];
  ledgerTypesError: boolean;
  cashLedgerIds: number[];
  cashCheckLoading: boolean;
  cashCheckError: boolean;
  errorMessage?: string | null;
  onCreate: (input: AcctLedgerCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctLedgerUpdateInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.acctLedger");
  const tUi = useTranslations("ui");
  const tErrors = useTranslations("errors");
  const [form, setForm] = useState<FormState>(() => toFormState(ledger));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const cashTaken = cashLedgerIds.length > 0 && !(ledger && cashLedgerIds.includes(ledger.ledgerId));

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const mainhdId = Number(form.mainhdId);
    const base = {
      ledgerName: form.ledgerName.trim(),
      ledgerType: form.ledgerType.trim() ? (/^\d+$/.test(form.ledgerType) ? Number(form.ledgerType) : form.ledgerType) : null,
      mainhdId: Number.isFinite(mainhdId) && mainhdId > 0 ? mainhdId : 0,
      isActive: form.isActive,
    };

    if (mode === "edit" && ledger) {
      const payload: AcctLedgerUpdateInput = {
        ...base,
        ledgerId: ledger.ledgerId,
      };
      const parsed = acctLedgerUpdateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          ledgerName: flat.ledgerName?.[0] ?? "",
          ledgerType: flat.ledgerType?.[0] ?? "",
          mainhdId: flat.mainhdId?.[0] ?? "",
        });
        return;
      }
      await onUpdate(parsed.data);
      return;
    }

    const parsed = acctLedgerCreateInputSchema.safeParse(base);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        ledgerName: flat.ledgerName?.[0] ?? "",
        ledgerType: flat.ledgerType?.[0] ?? "",
        mainhdId: flat.mainhdId?.[0] ?? "",
      });
      return;
    }
    await onCreate(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="acct-ledger-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />

      <TextField
        label={t("fields.ledgerName")}
        value={form.ledgerName}
        required
        maxLength={150}
        error={fieldErrors.ledgerName || undefined}
        onChange={(value) => updateField("ledgerName", value)}
      />

      <SelectField
        label={t("fields.mainhdId")}
        value={form.mainhdId}
        required
        searchable
        placeholder={t("fields.mainhdIdPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.mainhdId || undefined}
        onChange={(mainhdId) => updateField("mainhdId", mainhdId)}
        options={mainHeads}
      />

      <SelectField
        label={t("fields.ledgerType")}
        value={form.ledgerType}
        placeholder={t("ledgerTypes.placeholder")}
        error={fieldErrors.ledgerType || undefined}
        disabled={ledgerTypesError || cashCheckLoading || cashCheckError}
        hint={ledgerTypesError || cashCheckError ? tErrors("generic") : cashTaken ? t("cashAlreadyExists") : undefined}
        onChange={(value) => updateField("ledgerType", value)}
        options={[
          ...ledgerTypes.filter((option) => !cashTaken || option.label.trim().toLocaleLowerCase() !== "cash"),
          ...(form.ledgerType && !ledgerTypes.some((option) => option.value === form.ledgerType)
            ? [{ value: form.ledgerType, label: form.ledgerType }]
            : []),
        ]}
      />

      <CheckboxField
        label={t("fields.isActive")}
        checked={form.isActive}
        onChange={(checked) => updateField("isActive", checked)}
      />
    </form>
  );
}
