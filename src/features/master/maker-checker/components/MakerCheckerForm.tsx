"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { PageToast } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Form";
import {
  makerCheckerCreateInputSchema,
  makerCheckerUpdateInputSchema,
} from "@/features/master/maker-checker/schemas/maker-checker.schema";
import type {
  MakerCheckerCreateInput,
  MakerCheckerRule,
  MakerCheckerUpdateInput,
} from "@/features/master/maker-checker/types/maker-checker.types";

type RoleOption = { value: string; label: string };

type MakerCheckerFormProps = {
  open: boolean;
  mode: "create" | "edit";
  rule: MakerCheckerRule | null;
  saving: boolean;
  errorMessage?: string | null;
  roleOptions: RoleOption[];
  voucherOptions: RoleOption[];
  voucherTypesDisabled: boolean;
  onClose: () => void;
  onSubmitCreate: (input: MakerCheckerCreateInput) => Promise<void> | void;
  onSubmitUpdate: (input: MakerCheckerUpdateInput) => Promise<void> | void;
};

type FormState = {
  voucherType: string;
  thresholdLimit: string;
  checkerRoleId: string;
  dualAuthReq: boolean;
  autoApprv: boolean;
  isActive: boolean;
};

function toFormState(rule: MakerCheckerRule | null): FormState {
  if (!rule) {
    return {
      voucherType: "",
      thresholdLimit: "0",
      checkerRoleId: "",
      dualAuthReq: true,
      autoApprv: false,
      isActive: true,
    };
  }
  return {
    voucherType: String(rule.voucherType),
    thresholdLimit: String(rule.thresholdLimit),
    checkerRoleId: rule.checkerRoleId,
    dualAuthReq: rule.dualAuthReq,
    autoApprv: rule.autoApprv,
    isActive: rule.isActive,
  };
}

function parseAmount(raw: string): number {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return Number.NaN;
  return Number(trimmed);
}

function parseWholeNumber(raw: string): number {
  if (!/^\d+$/.test(raw.trim())) return Number.NaN;
  return Number(raw.trim());
}

export function MakerCheckerForm({
  open,
  mode,
  rule,
  saving,
  errorMessage,
  roleOptions,
  voucherOptions,
  voucherTypesDisabled,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: MakerCheckerFormProps) {
  const t = useTranslations("master.makerChecker");
  const tUi = useTranslations("ui");
  const formKey = mode === "edit" ? `edit-${rule?.id ?? 0}` : "create";

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
            form="maker-checker-form"
            icon={Save}
            disabled={saving || voucherTypesDisabled}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <MakerCheckerFormBody
        key={formKey}
        mode={mode}
        rule={rule}
        errorMessage={errorMessage}
        roleOptions={roleOptions}
        voucherOptions={voucherOptions}
        voucherTypesDisabled={voucherTypesDisabled}
        onSubmitCreate={onSubmitCreate}
        onSubmitUpdate={onSubmitUpdate}
        selectSearch={tUi("selectSearch")}
        selectEmpty={tUi("selectEmpty")}
        labels={{
          voucherType: t("fields.voucherType"),
          thresholdLimit: t("fields.thresholdLimit"),
          thresholdLimitHint: t("hints.thresholdLimit"),
          checkerRoleId: t("fields.checkerRoleId"),
          checkerRolePlaceholder: t("fields.checkerRolePlaceholder"),
          dualAuthReq: t("fields.dualAuthReq"),
          autoApprv: t("fields.autoApprv"),
          isActive: t("fields.isActive"),
        }}
      />
    </Modal>
  );
}

type BodyProps = {
  mode: "create" | "edit";
  rule: MakerCheckerRule | null;
  errorMessage?: string | null;
  roleOptions: RoleOption[];
  voucherOptions: RoleOption[];
  voucherTypesDisabled: boolean;
  onSubmitCreate: (input: MakerCheckerCreateInput) => Promise<void> | void;
  onSubmitUpdate: (input: MakerCheckerUpdateInput) => Promise<void> | void;
  selectSearch: string;
  selectEmpty: string;
  labels: {
    voucherType: string;
    thresholdLimit: string;
    thresholdLimitHint: string;
    checkerRoleId: string;
    checkerRolePlaceholder: string;
    dualAuthReq: string;
    autoApprv: string;
    isActive: string;
  };
};

function MakerCheckerFormBody({
  mode,
  rule,
  errorMessage,
  roleOptions,
  voucherOptions,
  voucherTypesDisabled,
  onSubmitCreate,
  onSubmitUpdate,
  selectSearch,
  selectEmpty,
  labels,
}: BodyProps) {
  const t = useTranslations("master.makerChecker");
  const [form, setForm] = useState<FormState>(() => toFormState(rule));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateForm(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!form.voucherType.trim()) {
      errors.voucherType = t("errors.voucherTypeRequired");
    } else {
      const voucherType = parseWholeNumber(form.voucherType);
      if (Number.isNaN(voucherType)) {
        errors.voucherType = t("errors.voucherTypeRequired");
      } else if (voucherType < 1) {
        errors.voucherType = t("errors.voucherTypeMin");
      }
    }

    if (!form.thresholdLimit.trim()) {
      errors.thresholdLimit = t("errors.thresholdLimitRequired");
    } else {
      const thresholdLimit = parseAmount(form.thresholdLimit);
      if (Number.isNaN(thresholdLimit)) {
        errors.thresholdLimit = t("errors.thresholdLimitRequired");
      } else if (thresholdLimit < 0) {
        errors.thresholdLimit = t("errors.thresholdLimitMin");
      }
    }

    if (!form.checkerRoleId.trim()) {
      errors.checkerRoleId = t("errors.checkerRoleRequired");
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (voucherTypesDisabled) return;

    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});

    const base = {
      voucherType: parseWholeNumber(form.voucherType),
      thresholdLimit: parseAmount(form.thresholdLimit),
      checkerRoleId: form.checkerRoleId.trim(),
      dualAuthReq: form.dualAuthReq,
      autoApprv: form.autoApprv,
      isActive: form.isActive,
    };

    if (mode === "create") {
      const parsed = makerCheckerCreateInputSchema.safeParse(base);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          voucherType: flat.voucherType?.[0]
            ? t("errors.voucherTypeRequired")
            : "",
          thresholdLimit: flat.thresholdLimit?.[0]
            ? t("errors.thresholdLimitRequired")
            : "",
          checkerRoleId: flat.checkerRoleId?.[0]
            ? t("errors.checkerRoleRequired")
            : "",
        });
        return;
      }
      await onSubmitCreate(parsed.data);
      return;
    }

    if (!rule) return;
    const parsed = makerCheckerUpdateInputSchema.safeParse({
      id: rule.id,
      ...base,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        voucherType: flat.voucherType?.[0]
          ? t("errors.voucherTypeRequired")
          : "",
        thresholdLimit: flat.thresholdLimit?.[0]
          ? t("errors.thresholdLimitRequired")
          : "",
        checkerRoleId: flat.checkerRoleId?.[0]
          ? t("errors.checkerRoleRequired")
          : "",
      });
      return;
    }
    await onSubmitUpdate(parsed.data);
  }

  return (
    <form autoComplete="off"
      id="maker-checker-form"
      className="flex flex-col gap-3"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <PageToast message={errorMessage ?? null} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectField
          label={labels.voucherType}
          value={form.voucherType}
          required
          searchable
          disabled={voucherTypesDisabled}
          placeholder={labels.voucherType}
          searchPlaceholder={selectSearch}
          emptyMessage={selectEmpty}
          options={voucherOptions}
          error={fieldErrors.voucherType || undefined}
          onChange={(value) => updateField("voucherType", value)}
        />
        <TextField
          label={labels.thresholdLimit}
          value={form.thresholdLimit}
          required
          inputMode="decimal"
          restrict="decimal"
          hint={labels.thresholdLimitHint}
          error={fieldErrors.thresholdLimit || undefined}
          onChange={(value) => updateField("thresholdLimit", value)}
        />
        <div className="sm:col-span-2">
          <SelectField
            label={labels.checkerRoleId}
            value={form.checkerRoleId}
            required
            searchable
            placeholder={labels.checkerRolePlaceholder}
            searchPlaceholder={selectSearch}
            emptyMessage={selectEmpty}
            options={roleOptions}
            error={fieldErrors.checkerRoleId || undefined}
            onChange={(value) => updateField("checkerRoleId", value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <CheckboxField
          label={labels.dualAuthReq}
          checked={form.dualAuthReq}
          onChange={(checked) => updateField("dualAuthReq", checked)}
        />
        <CheckboxField
          label={labels.autoApprv}
          checked={form.autoApprv}
          onChange={(checked) => updateField("autoApprv", checked)}
        />
        <CheckboxField
          label={labels.isActive}
          checked={form.isActive}
          onChange={(checked) => updateField("isActive", checked)}
        />
      </div>
    </form>
  );
}
