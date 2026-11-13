"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Card } from "@/components/ui/Card";
import { CheckboxField, TextField } from "@/components/ui/Form";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  fetchWhatsAppSettings,
  isWhatsAppSettingsClientError,
  saveWhatsAppSettings,
} from "@/features/master/whatsapp-settings/services/whatsapp-settings-client";
import { whatsAppSettingsUpdateInputSchema } from "@/features/master/whatsapp-settings/schemas/whatsapp-settings.schema";
import type { WhatsAppSettings } from "@/features/master/whatsapp-settings/types/whatsapp-settings.types";

type FormState = {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  webhookUrl: string;
  verifyToken: string;
  isDefault: boolean;
};

type LoadStatus =
  | { status: "loading" }
  | { status: "ready"; settings: WhatsAppSettings | null }
  | { status: "error"; message: string };

const EMPTY_FORM: FormState = {
  accessToken: "",
  phoneNumberId: "",
  wabaId: "",
  webhookUrl: "",
  verifyToken: "",
  isDefault: true,
};

function toFormState(data: WhatsAppSettings): FormState {
  return {
    accessToken: data.accessToken,
    phoneNumberId: data.phoneNumberId,
    wabaId: data.wabaId,
    webhookUrl: data.webhookUrl ?? "",
    verifyToken: data.verifyToken ?? "",
    isDefault: data.isDefault,
  };
}

export function WhatsAppSettingsForm() {
  const t = useTranslations("master.whatsAppSettings");
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
        const data = await fetchWhatsAppSettings();
        if (cancelled) return;
        setForm(toFormState(data));
        setLoadState({ status: "ready", settings: data });
      } catch (error) {
        if (cancelled) return;
        if (isWhatsAppSettingsClientError(error) && error.status === 401) {
          router.replace("/login");
          return;
        }
        if (isWhatsAppSettingsClientError(error) && error.status === 404) {
          setForm(EMPTY_FORM);
          setLoadState({ status: "ready", settings: null });
          return;
        }
        setLoadState({
          status: "error",
          message: isWhatsAppSettingsClientError(error)
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
      accessToken: form.accessToken.trim(),
      phoneNumberId: form.phoneNumberId.trim(),
      wabaId: form.wabaId.trim(),
      webhookUrl: form.webhookUrl.trim() || null,
      verifyToken: form.verifyToken.trim() || null,
      isDefault: form.isDefault,
    };

    const parsed = whatsAppSettingsUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        accessToken: flat.accessToken?.[0] ?? "",
        phoneNumberId: flat.phoneNumberId?.[0] ?? "",
        wabaId: flat.wabaId?.[0] ?? "",
        webhookUrl: flat.webhookUrl?.[0] ?? "",
        verifyToken: flat.verifyToken?.[0] ?? "",
      });
      setFormError(t("validationFailed"));
      return;
    }

    setSaving(true);
    try {
      const updated = await saveWhatsAppSettings({
        ...parsed.data,
        webhookUrl: parsed.data.webhookUrl || null,
        verifyToken: parsed.data.verifyToken || null,
      });
      setForm(toFormState(updated));
      setLoadState({ status: "ready", settings: updated });
      setSuccessMessage(t("saveSuccess"));
    } catch (error) {
      if (isWhatsAppSettingsClientError(error) && error.status === 401) {
        router.replace("/login");
        return;
      }
      if (isWhatsAppSettingsClientError(error) && error.status === 422) {
        setFormError(error.message || t("validationFailed"));
        const details = error.details as
          | { fieldErrors?: Record<string, string[]> }
          | undefined;
        if (details?.fieldErrors) {
          setFieldErrors({
            accessToken: details.fieldErrors.accessToken?.[0] ?? "",
            phoneNumberId: details.fieldErrors.phoneNumberId?.[0] ?? "",
            wabaId: details.fieldErrors.wabaId?.[0] ?? "",
            webhookUrl: details.fieldErrors.webhookUrl?.[0] ?? "",
            verifyToken: details.fieldErrors.verifyToken?.[0] ?? "",
          });
        }
        return;
      }
      setFormError(
        isWhatsAppSettingsClientError(error)
          ? error.message
          : tErrors("generic"),
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

      <form autoComplete="off"
        id="whatsapp-settings-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <Card title={t("title")} description={t("description")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextField
                label={t("fields.accessToken")}
                type="password"
                value={form.accessToken}
                required
                error={fieldErrors.accessToken || undefined}
                onChange={(value) => updateField("accessToken", value)}
              />
            </div>
            <TextField
              label={t("fields.phoneNumberId")}
              value={form.phoneNumberId}
              required
              error={fieldErrors.phoneNumberId || undefined}
              onChange={(value) => updateField("phoneNumberId", value)}
            />
            <TextField
              label={t("fields.wabaId")}
              value={form.wabaId}
              required
              error={fieldErrors.wabaId || undefined}
              onChange={(value) => updateField("wabaId", value)}
            />
            <TextField
              label={t("fields.webhookUrl")}
              value={form.webhookUrl}
              hint={t("hints.webhookUrl")}
              error={fieldErrors.webhookUrl || undefined}
              onChange={(value) => updateField("webhookUrl", value)}
            />
            <TextField
              label={t("fields.verifyToken")}
              type="password"
              value={form.verifyToken}
              error={fieldErrors.verifyToken || undefined}
              onChange={(value) => updateField("verifyToken", value)}
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
            <Button type="submit" disabled={saving} icon={MessageCircle}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
