"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Form";
import {
  acctCategoryCreateInputSchema,
  acctCategoryUpdateInputSchema,
} from "@/features/master/acct-category/schemas/acct-category.schema";
import {
  ACCT_CATEGORY_TYPE_OPTIONS,
  type AcctCategory,
  type AcctCategoryCreateInput,
  type AcctCategoryUpdateInput,
} from "@/features/master/acct-category/types/acct-category.types";

type AcctCategoryFormProps = {
  open: boolean;
  mode: "create" | "edit";
  category: AcctCategory | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onCreate: (input: AcctCategoryCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctCategoryUpdateInput) => Promise<void> | void;
};

type FormState = {
  categName: string;
  categoryType: string;
};

function toFormState(category: AcctCategory | null): FormState {
  if (!category) {
    return {
      categName: "",
      categoryType: "",
    };
  }
  return {
    categName: category.categName,
    categoryType: category.categoryType ?? "",
  };
}

export function AcctCategoryForm({
  open,
  mode,
  category,
  saving,
  errorMessage,
  onClose,
  onCreate,
  onUpdate,
}: AcctCategoryFormProps) {
  const t = useTranslations("master.acctCategory");
  const formKey = mode === "edit" ? `edit-${category?.categId ?? 0}` : "create";

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
            form="acct-category-form"
            icon={Save}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <AcctCategoryFormBody
        key={formKey}
        mode={mode}
        category={category}
        errorMessage={errorMessage}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </Modal>
  );
}

function AcctCategoryFormBody({
  mode,
  category,
  errorMessage,
  onCreate,
  onUpdate,
}: {
  mode: "create" | "edit";
  category: AcctCategory | null;
  errorMessage?: string | null;
  onCreate: (input: AcctCategoryCreateInput) => Promise<void> | void;
  onUpdate: (input: AcctCategoryUpdateInput) => Promise<void> | void;
}) {
  const t = useTranslations("master.acctCategory");
  const tUi = useTranslations("ui");
  const [form, setForm] = useState<FormState>(() => toFormState(category));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const base = {
      categName: form.categName.trim(),
      categoryType: form.categoryType.trim(),
    };

    if (mode === "edit" && category) {
      const payload: AcctCategoryUpdateInput = {
        ...base,
        categId: category.categId,
      };
      const parsed = acctCategoryUpdateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          categName: flat.categName?.[0] ?? "",
          categoryType: flat.categoryType?.[0] ?? "",
        });
        return;
      }
      await onUpdate(parsed.data);
      return;
    }

    const parsed = acctCategoryCreateInputSchema.safeParse(base);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        categName: flat.categName?.[0] ?? "",
        categoryType: flat.categoryType?.[0] ?? "",
      });
      return;
    }
    await onCreate(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="acct-category-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <PageToast message={errorMessage ?? null} tone="error" />

      <TextField
        label={t("fields.categName")}
        value={form.categName}
        required
        maxLength={100}
        error={fieldErrors.categName || undefined}
        onChange={(value) => updateField("categName", value)}
      />

      <SelectField
        label={t("fields.categoryType")}
        value={form.categoryType}
        required
        searchable={false}
        placeholder={t("fields.categoryTypePlaceholder")}
        searchPlaceholder={tUi("selectSearch")}
        emptyMessage={tUi("selectEmpty")}
        error={fieldErrors.categoryType || undefined}
        onChange={(categoryType) => updateField("categoryType", categoryType)}
        options={ACCT_CATEGORY_TYPE_OPTIONS.map((code) => ({
          value: code,
          label: t(`types.${code}`),
        }))}
      />
    </form>
  );
}
