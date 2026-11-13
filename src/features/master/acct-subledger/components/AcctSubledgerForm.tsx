"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Form";
import {
  acctSubledgerCreateInputSchema,
  acctSubledgerUpdateInputSchema,
} from "@/features/master/acct-subledger/schemas/acct-subledger.schema";
import type {
  AcctSubledger,
  AcctSubledgerCreateInput,
  AcctSubledgerUpdateInput,
} from "@/features/master/acct-subledger/types/acct-subledger.types";
import type { AcctSubledgerLedgerOption } from "@/features/master/acct-subledger/components/AcctSubledgerFilters";

type AcctSubledgerFormProps = {
  open: boolean;
  mode: "create" | "edit";
  subledger: AcctSubledger | null;
  ledgers: AcctSubledgerLedgerOption[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onCreate: (input: AcctSubledgerCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctSubledgerUpdateInput) => Promise<void> | void;
};

type FormState = {
  subledgName: string;
  ledgerId: string;
  isActive: boolean;
};

function toFormState(subledger: AcctSubledger | null): FormState {
  if (!subledger) {
    return {
      subledgName: "",
      ledgerId: "",
      isActive: true,
    };
  }
  return {
    subledgName: subledger.subledgName,
    ledgerId: String(subledger.ledgerId),
    isActive: subledger.isActive,
  };
}

export function AcctSubledgerForm({
  open,
  mode,
  subledger,
  ledgers,
  saving,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: AcctSubledgerFormProps) {
  const t = useTranslations("master.acctSubledger");
  const formKey =
    mode === "edit" ? `edit-${subledger?.subledgId ?? 0}` : "create";

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
            form="acct-subledger-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <AcctSubledgerFormBody
        key={formKey}
        mode={mode}
        subledger={subledger}
        ledgers={ledgers}
        errorMessage={errorMessage}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </Modal>
  );
}

function AcctSubledgerFormBody({
  mode,
  subledger,
  ledgers,
  errorMessage,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  subledger: AcctSubledger | null;
  ledgers: AcctSubledgerLedgerOption[];
  errorMessage?: string | null;
  onCreate: (input: AcctSubledgerCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctSubledgerUpdateInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.acctSubledger");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() => toFormState(subledger));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const ledgerId = Number(form.ledgerId);
    const base = {
      subledgName: form.subledgName.trim(),
      ledgerId: Number.isFinite(ledgerId) && ledgerId > 0 ? ledgerId : 0,
      isActive: form.isActive,
    };

    if (mode === "edit" && subledger) {
      const payload: AcctSubledgerUpdateInput = {
        ...base,
        subledgId: subledger.subledgId,
      };
      const parsed = acctSubledgerUpdateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          subledgName: flat.subledgName?.[0] ?? "",
          ledgerId: flat.ledgerId?.[0] ?? "",
        });
        return;
      }
      await onUpdate(parsed.data);
      return;
    }

    const parsed = acctSubledgerCreateInputSchema.safeParse(base);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        subledgName: flat.subledgName?.[0] ?? "",
        ledgerId: flat.ledgerId?.[0] ?? "",
      });
      return;
    }
    await onCreate(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="acct-subledger-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />

      <TextField
        label={t("fields.subledgName")}
        value={form.subledgName}
        required
        maxLength={100}
        error={fieldErrors.subledgName || undefined}
        onChange={(value) => updateField("subledgName", value)}
      />

      <SelectField
        label={t("fields.ledgerId")}
        value={form.ledgerId}
        required
        searchable
        placeholder={t("fields.ledgerIdPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.ledgerId || undefined}
        onChange={(ledgerId) => updateField("ledgerId", ledgerId)}
        options={ledgers}
      />

      <CheckboxField
        label={t("fields.isActive")}
        checked={form.isActive}
        onChange={(checked) => updateField("isActive", checked)}
      />
    </form>
  );
}
