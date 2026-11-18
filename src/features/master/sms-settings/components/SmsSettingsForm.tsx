"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { RadioTower } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Card } from "@/components/ui/Card";
import { CheckboxField, TextField } from "@/components/ui/Form";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  fetchSmsSettings,
  isSmsSettingsClientError,
  saveSmsSettings,
} from "@/features/master/sms-settings/services/sms-settings-client";
import { smsSettingsUpdateInputSchema } from "@/features/master/sms-settings/schemas/sms-settings.schema";
import type { SmsSettings } from "@/features/master/sms-settings/types/sms-settings.types";

type FormState = {
  apiKey: string;
  headerKey: string;
  userName: string;
  userPassword: string;
  isDefault: boolean;
};

type LoadStatus =
  | { status: "loading" }
  | { status: "ready"; settings: SmsSettings | null }
  | { status: "error"; message: string };

const EMPTY_FORM: FormState = {
  apiKey: "",
  headerKey: "",
  userName: "",
  userPassword: "",
  isDefault: true,
};

function toFormState(data: SmsSettings): FormState {
  return {
    apiKey: data.apiKey,
    headerKey: data.headerKey,
    userName: data.userName,
    userPassword: data.userPassword,
    isDefault: data.isDefault,
  };
}

export function SmsSettingsForm() {
  const t = useTranslations("master.smsSettings");
  const tErrors = useTranslations("errors");
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadStatus>({ status: "loading" });
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useToastText();
  const [successMessage, setSuccessMessage] = useToastText();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState({ status: "loading" });
      setFormError(null);
      setSuccessMessage(null);

      try {
        const data = await fetchSmsSettings();
        if (cancelled) return;
        setForm(toFormState(data));
        setLoadState({ status: "ready", settings: data });
      } catch (error) {
        if (cancelled) return;
        if (isSmsSettingsClientError(error) && error.status === 401) {
          router.replace("/login");
          return;
        }
        if (isSmsSettingsClientError(error) && error.status === 404) {
          setForm(EMPTY_FORM);
          setLoadState({ status: "ready", settings: null });
          return;
        }
        setLoadState({
          status: "error",
          message: isSmsSettingsClientError(error)
            ? error.message
            : tErrors("generic"),
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, tErrors]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setFormError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const payload = {
      apiKey: form.apiKey.trim(),
      headerKey: form.headerKey.trim(),
      userName: form.userName.trim(),
      userPassword: form.userPassword,
      isDefault: form.isDefault,
    };

    const parsed = smsSettingsUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        apiKey: flat.apiKey?.[0] ?? "",
        headerKey: flat.headerKey?.[0] ?? "",
        userName: flat.userName?.[0] ?? "",
        userPassword: flat.userPassword?.[0] ?? "",
      });
      setFormError(t("validationFailed"));
      return;
    }

    setSaving(true);
    try {
      const updated = await saveSmsSettings(parsed.data);
      setForm(toFormState(updated));
      setLoadState({ status: "ready", settings: updated });
      setSuccessMessage(t("saveSuccess"));
    } catch (error) {
      if (isSmsSettingsClientError(error) && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (isSmsSettingsClientError(error) && error.status === 422) {
        setFormError(error.message || t("validationFailed"));
        const details = error.details as
          | { fieldErrors?: Record<string, string[]> }
          | undefined;
        if (details?.fieldErrors) {
          setFieldErrors({
            apiKey: details.fieldErrors.apiKey?.[0] ?? "",
            headerKey: details.fieldErrors.headerKey?.[0] ?? "",
            userName: details.fieldErrors.userName?.[0] ?? "",
            userPassword: details.fieldErrors.userPassword?.[0] ?? "",
          });
        }
        return;
      }
      setFormError(
        isSmsSettingsClientError(error) ? error.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadState.status === "loading") {
    return <LoadingState title={t("loading")} />;
  }

  if (loadState.status === "error") {
    return (
      <ErrorState
        title={t("loadErrorTitle")}
        message={loadState.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!form) {
    return <LoadingState title={t("loading")} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={successMessage} />

      <PageToast message={formError} tone="error" />

      {loadState.status === "ready" && loadState.settings == null ? (
        <Alert tone="info">{t("notConfiguredHint")}</Alert>
      ) : null}

      <form autoComplete="off" id="sms-settings-form" onSubmit={(event) => void handleSubmit(event)}>
        <Card title={t("title")} description={t("description")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label={t("fields.apiKey")}
              type="password"
              value={form.apiKey}
              required
              error={fieldErrors.apiKey || undefined}
              onChange={(value) => updateField("apiKey", value)}
            />
            <TextField
              label={t("fields.headerKey")}
              value={form.headerKey}
              required
              hint={t("hints.headerKey")}
              error={fieldErrors.headerKey || undefined}
              onChange={(value) => updateField("headerKey", value)}
            />
            <TextField
              label={t("fields.userName")}
              value={form.userName}
              required
              error={fieldErrors.userName || undefined}
              onChange={(value) => updateField("userName", value)}
            />
            <TextField
              label={t("fields.userPassword")}
              type="password"
              value={form.userPassword}
              required
              error={fieldErrors.userPassword || undefined}
              onChange={(value) => updateField("userPassword", value)}
            />
          </div>

          <div className="mt-4">
            <CheckboxField
              label={t("fields.isDefault")}
              checked={form.isDefault}
              onChange={(checked) => updateField("isDefault", checked)}
            />
          </div>

          <div className="btn-actions mt-5 border-t border-border pt-4">
            <Button type="submit" disabled={saving} icon={RadioTower}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
