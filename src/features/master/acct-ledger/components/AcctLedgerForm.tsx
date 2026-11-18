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
import type { AcctHead } from "@/features/master/acct-head/types/acct-head.types";

type AcctLedgerFormBodyProps = {
  mode: "create" | "edit";
  ledger: AcctLedger | null;
  mainHeads: AcctHead[] | null;
  mainHeadsError: boolean;
  categories: AcctLedgerMainHeadOption[];
  categoryOptionsError: boolean;
  ledgerTypes: AcctLedgerMainHeadOption[];
  ledgerTypesError: boolean;
  cashLedgerIds: number[];
  cashCheckLoading: boolean;
  cashCheckError: boolean;
  errorMessage?: string | null;
  onCreate: (input: AcctLedgerCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctLedgerUpdateInput) => Promise<void> | void;
};

type AcctLedgerFormProps = AcctLedgerFormBodyProps & {
  open: boolean;
  saving: boolean;
  onClose: () => void;
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
  saving,
  onClose,
  ...bodyProps
}: AcctLedgerFormProps) {
  const t = useTranslations("master.acctLedger");
  const { mode, ledger } = bodyProps;
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
      <AcctLedgerFormBody key={formKey} {...bodyProps} />
    </Modal>
  );
}

function AcctLedgerFormBody({
  mode,
  ledger,
  mainHeads,
  mainHeadsError,
  categories,
  categoryOptionsError,
  ledgerTypes,
  ledgerTypesError,
  cashLedgerIds,
  cashCheckLoading,
  cashCheckError,
  errorMessage,
  onCreate,
  onUpdate,
}: AcctLedgerFormBodyProps) {
  const t = useTranslations("master.acctLedger");
  const tHead = useTranslations("master.acctHead");
  const tUi = useTranslations("ui");
  const tErrors = useTranslations("errors");
  const [form, setForm] = useState<FormState>(() => toFormState(ledger));
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const cashTaken = cashLedgerIds.length > 0 && !(ledger && cashLedgerIds.includes(ledger.ledgerId));

  const headOptions = (mainHeads ?? []).map((head) => ({
    value: String(head.mainhdId),
    label: head.mainhdCode ? `${head.mainhdName} (${head.mainhdCode})` : head.mainhdName,
    categoryId: String(head.categId),
  }));
  if (ledger && !headOptions.some((head) => head.value === String(ledger.mainhdId))) {
    headOptions.push({
      value: String(ledger.mainhdId),
      label: ledger.mainhdName || ledger.mainhdCode || String(ledger.mainhdId),
      categoryId: String(ledger.categId ?? ""),
    });
  }

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
        label={tHead("filters.category")}
        value={categoryFilter}
        searchable
        disabled={categoryOptionsError || mainHeads === null}
        hint={categoryOptionsError ? tErrors("generic") : undefined}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        onChange={(categoryId) => {
          setCategoryFilter(categoryId);
          const selectedHead = headOptions.find((head) => head.value === form.mainhdId);
          if (categoryId && selectedHead?.categoryId !== categoryId) {
            updateField("mainhdId", "");
          }
        }}
        options={[{ value: "", label: tHead("filters.categoryAll") }, ...categories]}
      />

      <SelectField
        label={t("fields.mainhdId")}
        value={form.mainhdId}
        required
        searchable
        placeholder={t("fields.mainhdIdPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        disabled={mainHeads === null}
        hint={mainHeadsError ? tErrors("generic") : mainHeads === null ? tUi("loading") : undefined}
        error={fieldErrors.mainhdId || undefined}
        onChange={(mainhdId) => updateField("mainhdId", mainhdId)}
        options={headOptions.filter((head) => !categoryFilter || head.categoryId === categoryFilter)}
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
