"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/Form";
import {
  roleCreateInputSchema,
  roleUpdateInputSchema,
} from "@/features/master/roles/schemas/role.schema";
import type {
  Role,
  RoleCreateInput,
  RoleUpdateInput,
} from "@/features/master/roles/types/role.types";

type RolesFormProps = {
  open: boolean;
  mode: "create" | "edit";
  role: Role | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmitCreate: (input: RoleCreateInput) => Promise<void> | void;
  onSubmitUpdate: (input: RoleUpdateInput) => Promise<void> | void;
};

type FormState = {
  roleName: string;
  isAdmin: boolean;
  status: number;
};

function toFormState(role: Role | null): FormState {
  if (!role) {
    return { roleName: "", isAdmin: false, status: 1 };
  }
  return {
    roleName: role.roleName,
    isAdmin: role.isAdmin,
    status: role.status,
  };
}

export function RolesForm({
  open,
  mode,
  role,
  saving,
  errorMessage,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: RolesFormProps) {
  const t = useTranslations("master.roles");
  const tUi = useTranslations("ui");
  const formKey = mode === "edit" ? `edit-${role?.id ?? 0}` : "create";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? t("createTitle") : t("editTitle")}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="roles-form" icon={Save} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </>
      }
    >
      <RolesFormBody
        key={formKey}
        mode={mode}
        role={role}
        errorMessage={errorMessage}
        onSubmitCreate={onSubmitCreate}
        onSubmitUpdate={onSubmitUpdate}
        statusActiveLabel={t("statusActive")}
        statusInactiveLabel={t("statusInactive")}
        selectSearch={tUi("selectSearch")}
        selectEmpty={tUi("selectEmpty")}
        fieldLabels={{
          roleName: t("fields.roleName"),
          isAdmin: t("fields.isAdmin"),
          status: t("fields.status"),
        }}
      />
    </Modal>
  );
}

type BodyProps = {
  mode: "create" | "edit";
  role: Role | null;
  errorMessage?: string | null;
  onSubmitCreate: (input: RoleCreateInput) => Promise<void> | void;
  onSubmitUpdate: (input: RoleUpdateInput) => Promise<void> | void;
  statusActiveLabel: string;
  statusInactiveLabel: string;
  selectSearch: string;
  selectEmpty: string;
  fieldLabels: {
    roleName: string;
    isAdmin: string;
    status: string;
  };
};

function RolesFormBody({
  mode,
  role,
  errorMessage,
  onSubmitCreate,
  onSubmitUpdate,
  statusActiveLabel,
  statusInactiveLabel,
  selectSearch,
  selectEmpty,
  fieldLabels,
}: BodyProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(role));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    if (mode === "create") {
      const payload: RoleCreateInput = {
        roleName: form.roleName,
        isAdmin: form.isAdmin,
        status: form.status,
      };
      const parsed = roleCreateInputSchema.safeParse(payload);
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        const next: Record<string, string> = {};
        for (const [key, messages] of Object.entries(flat)) {
          if (messages?.[0]) next[key] = messages[0];
        }
        setFieldErrors(next);
        return;
      }
      await onSubmitCreate(parsed.data);
      return;
    }

    if (!role) return;
    const payload: RoleUpdateInput = {
      roleId: role.id,
      roleName: form.roleName,
      isAdmin: form.isAdmin,
      status: form.status,
    };
    const parsed = roleUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flat)) {
        if (messages?.[0]) next[key] = messages[0];
      }
      setFieldErrors(next);
      return;
    }
    await onSubmitUpdate(parsed.data);
  }

  return (
    <form
      id="roles-form"
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

      <TextField
        label={fieldLabels.roleName}
        required
        value={form.roleName}
        maxLength={100}
        error={fieldErrors.roleName}
        onChange={(roleName) => setForm((prev) => ({ ...prev, roleName }))}
      />

      <SelectField
        label={fieldLabels.status}
        value={String(form.status)}
        searchable={false}
        searchPlaceholder={selectSearch}
        emptyMessage={selectEmpty}
        onChange={(status) =>
          setForm((prev) => ({ ...prev, status: Number(status) }))
        }
        options={[
          { value: "1", label: statusActiveLabel },
          { value: "0", label: statusInactiveLabel },
        ]}
      />

      <CheckboxField
        label={fieldLabels.isAdmin}
        checked={form.isAdmin}
        onChange={(isAdmin) => setForm((prev) => ({ ...prev, isAdmin }))}
      />
    </form>
  );
}
