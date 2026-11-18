"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Form";

const MAX_PASSWORD_LENGTH = 128;

type FieldKey = "current" | "new" | "confirm";

type FormState = Record<FieldKey, string>;

const EMPTY_FORM: FormState = {
  current: "",
  new: "",
  confirm: "",
};

export function ChangePasswordForm() {
  const t = useTranslations("account.changePassword");
  const tAuth = useTranslations("auth");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [visible, setVisible] = useState<Record<FieldKey, boolean>>({
    current: false,
    new: false,
    confirm: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>(
    {},
  );
  const [notice, setNotice] = useState<string | null>(null);

  function update(key: FieldKey, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setNotice(null);
  }

  function validate(values: FormState): Partial<Record<FieldKey, string>> {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!values.current) next.current = t("errors.current");
    if (!values.new) next.new = t("errors.new");
    else if (values.current && values.new === values.current) {
      next.new = t("errors.same");
    }
    if (!values.confirm) next.confirm = t("errors.confirm");
    else if (values.new && values.confirm !== values.new) {
      next.confirm = t("errors.mismatch");
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotice(null);
      return;
    }
    setNotice(t("pendingApi"));
  }

  function passwordField(
    key: FieldKey,
    label: string,
    hint?: string,
  ): ReactNode {
    const shown = visible[key];
    return (
      <TextField
        label={label}
        name={key}
        type={shown ? "text" : "password"}
        required
        value={form[key]}
        maxLength={MAX_PASSWORD_LENGTH}
        hint={hint}
        error={fieldErrors[key]}
        onChange={(value) => update(key, value)}
        trailing={
          <button
            type="button"
            onClick={() =>
              setVisible((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={shown ? tAuth("hidePassword") : tAuth("showPassword")}
          >
            {shown ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
      />
    );
  }

  return (
    <form autoComplete="off" onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">
      {notice ? <Alert tone="warning">{notice}</Alert> : null}

      <Card title={t("title")} description={t("description")}>
        <div className="grid max-w-xl gap-4">
          {passwordField("current", t("current"))}
          {passwordField("new", t("new"), t("hint"))}
          {passwordField("confirm", t("confirm"))}
        </div>

        <div className="btn-actions mt-5 border-t border-border pt-4">
          <Button type="submit" icon={KeyRound}>
            {t("save")}
          </Button>
        </div>
      </Card>
    </form>
  );
}
