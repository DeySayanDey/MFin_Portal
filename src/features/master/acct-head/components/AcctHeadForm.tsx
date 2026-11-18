"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Form";
import {
  acctHeadCreateInputSchema,
  acctHeadUpdateInputSchema,
} from "@/features/master/acct-head/schemas/acct-head.schema";
import type {
  AcctHead,
  AcctHeadCreateInput,
  AcctHeadUpdateInput,
} from "@/features/master/acct-head/types/acct-head.types";
import type { AcctHeadCategoryOption } from "@/features/master/acct-head/components/AcctHeadFilters";

type AcctHeadFormProps = {
  open: boolean;
  mode: "create" | "edit";
  head: AcctHead | null;
  categories: AcctHeadCategoryOption[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onCreate: (input: AcctHeadCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctHeadUpdateInput) => Promise<void> | void;
};

type FormState = {
  mainhdName: string;
  categId: string;
  isActive: boolean;
};

function toFormState(head: AcctHead | null): FormState {
  if (!head) {
    return {
      mainhdName: "",
      categId: "",
      isActive: true,
    };
  }
  return {
    mainhdName: head.mainhdName,
    categId: String(head.categId),
    isActive: head.isActive,
  };
}

export function AcctHeadForm({
  open,
  mode,
  head,
  categories,
  saving,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: AcctHeadFormProps) {
  const t = useTranslations("master.acctHead");
  const formKey = mode === "edit" ? `edit-${head?.mainhdId ?? 0}` : "create";

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
            form="acct-head-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <AcctHeadFormBody
        key={formKey}
        mode={mode}
        head={head}
        categories={categories}
        errorMessage={errorMessage}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </Modal>
  );
}

function AcctHeadFormBody({
  mode,
  head,
  categories,
  errorMessage,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  head: AcctHead | null;
  categories: AcctHeadCategoryOption[];
  errorMessage?: string | null;
  onCreate: (input: AcctHeadCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctHeadUpdateInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.acctHead");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() => toFormState(head));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const categId = Number(form.categId);
    const base = {
      mainhdName: form.mainhdName.trim(),
      categId: Number.isFinite(categId) && categId > 0 ? categId : 0,
      isActive: form.isActive,
    };

    if (mode === "edit" && head) {
      const payload: AcctHeadUpdateInput = {
        ...base,
        mainhdId: head.mainhdId,
      };
      const parsed = acctHeadUpdateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          mainhdName: flat.mainhdName?.[0] ?? "",
          categId: flat.categId?.[0] ?? "",
        });
        return;
      }
      await onUpdate(parsed.data);
      return;
    }

    const parsed = acctHeadCreateInputSchema.safeParse(base);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        mainhdName: flat.mainhdName?.[0] ?? "",
        categId: flat.categId?.[0] ?? "",
      });
      return;
    }
    await onCreate(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="acct-head-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />

      <TextField
        label={t("fields.mainhdName")}
        value={form.mainhdName}
        required
        maxLength={150}
        error={fieldErrors.mainhdName || undefined}
        onChange={(value) => updateField("mainhdName", value)}
      />

      <SelectField
        label={t("fields.categId")}
        value={form.categId}
        required
        searchable
        placeholder={t("fields.categIdPlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.categId || undefined}
        onChange={(categId) => updateField("categId", categId)}
        options={categories}
      />

      <CheckboxField
        label={t("fields.isActive")}
        checked={form.isActive}
        onChange={(checked) => updateField("isActive", checked)}
      />
    </form>
  );
}
