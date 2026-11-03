"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { ModulePageShell } from "@/components/shared/ModulePageShell";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckboxField, TextField } from "@/components/ui/Form";
import { securityModulePages } from "@/lib/modules/module.types";
import { loginSecurityDraftSchema } from "@/features/security/login-settings/schemas/login-settings.schema";
import {
  fetchSecurityPolicy,
  isSecurityPolicyClientError,
  saveSecurityPolicy,
} from "@/features/security/login-settings/services/login-settings-client";
import {
  LOGIN_SECURITY_DEFAULTS,
  type LoginSecurityDraft,
} from "@/features/security/login-settings/types/login-settings.types";

type LoadStatus =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

/** Numbers stay as text so the last digit can be deleted while typing. */
type LoginSecurityForm = {
  maxAttempts: string;
  lockMinutes: string;
  dailyResetTime: string;
  minLength: string;
  maxLength: string;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
  uniquePasswordCount: string;
  expirationEnabled: boolean;
  expirationDays: string;
};

function toForm(policy: LoginSecurityDraft): LoginSecurityForm {
  return {
    maxAttempts: String(policy.maxAttempts),
    lockMinutes: String(policy.lockMinutes),
    dailyResetTime: policy.dailyResetTime,
    minLength: String(policy.minLength),
    maxLength: String(policy.maxLength),
    requireUppercase: policy.requireUppercase,
    requireLowercase: policy.requireLowercase,
    requireDigit: policy.requireDigit,
    requireSpecial: policy.requireSpecial,
    uniquePasswordCount: String(policy.uniquePasswordCount),
    expirationEnabled: policy.expirationEnabled,
    expirationDays: String(policy.expirationDays),
  };
}

function parseWholeNumber(raw: string): number {
  if (!/^\d+$/.test(raw.trim())) return Number.NaN;
  return Number(raw.trim());
}

function toDraft(form: LoginSecurityForm): LoginSecurityDraft {
  return {
    maxAttempts: parseWholeNumber(form.maxAttempts),
    lockMinutes: parseWholeNumber(form.lockMinutes),
    dailyResetTime: form.dailyResetTime,
    minLength: parseWholeNumber(form.minLength),
    maxLength: parseWholeNumber(form.maxLength),
    requireUppercase: form.requireUppercase,
    requireLowercase: form.requireLowercase,
    requireDigit: form.requireDigit,
    requireSpecial: form.requireSpecial,
    uniquePasswordCount: parseWholeNumber(form.uniquePasswordCount),
    expirationEnabled: form.expirationEnabled,
    expirationDays: parseWholeNumber(form.expirationDays),
  };
}

export function LoginSettingsView() {
  const t = useTranslations("security.loginSettings");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const pageMeta = securityModulePages.loginSettings.toJSON();
  const [loadState, setLoadState] = useState<LoadStatus>({ status: "loading" });
  const [form, setForm] = useState<LoginSecurityForm>(() =>
    toForm(LOGIN_SECURITY_DEFAULTS),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useToastText();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useToastText();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState({ status: "loading" });
      setFormError(null);
      setNotice(null);
      try {
        const policy = await fetchSecurityPolicy();
        if (cancelled) return;
        setForm(toForm(policy));
        setLoadState({ status: "ready" });
      } catch (error) {
        if (cancelled) return;
        if (isSecurityPolicyClientError(error) && error.status === 401) {
          router.replace("/login");
          return;
        }
        setLoadState({
          status: "error",
          message: isSecurityPolicyClientError(error)
            ? error.message
            : tErrors("generic"),
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, setNotice, tErrors]);

  function update<K extends keyof LoginSecurityForm>(
    key: K,
    value: LoginSecurityForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setFormError(null);
    const parsed = loginSecurityDraftSchema.safeParse(toDraft(form));
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const key of Object.keys(flat)) {
        next[key] = t(`errors.${key}` as "errors.maxAttempts");
      }
      setFieldErrors(next);
      setFormError(t("validationFailed"));
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const updated = await saveSecurityPolicy(parsed.data);
      setForm(toForm(updated));
      setNotice(t("saveSuccess"));
    } catch (error) {
      if (isSecurityPolicyClientError(error) && error.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(
        isSecurityPolicyClientError(error) ? error.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadState.status === "loading") {
    return (
      <ModulePageShell page={pageMeta}>
        <LoadingState title={t("loading")} />
      </ModulePageShell>
    );
  }

  if (loadState.status === "error") {
    return (
      <ModulePageShell page={pageMeta}>
        <ErrorState
          title={t("loadErrorTitle")}
          message={loadState.message}
          onRetry={() => window.location.reload()}
        />
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell page={pageMeta}>
      <PageToast message={notice} />
      <PageToast message={formError} tone="error" />

      <form id="login-settings-form" onSubmit={(event) => void handleSubmit(event)}>
        <Card title={t("title")} description={t("description")}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              className="bg-surface-muted shadow-none"
              title={t("attempts.title")}
              description={t("attempts.description")}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={t("attempts.maxAttempts")}
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={form.maxAttempts}
                  hint={t("attempts.maxAttemptsHint")}
                  error={fieldErrors.maxAttempts}
                  onChange={(value) => update("maxAttempts", value)}
                />
                <TextField
                  label={t("attempts.lockMinutes")}
                  type="number"
                  min={1}
                  max={1440}
                  required
                  value={form.lockMinutes}
                  hint={t("attempts.lockMinutesHint")}
                  error={fieldErrors.lockMinutes}
                  onChange={(value) => update("lockMinutes", value)}
                />
                <TextField
                  label={t("attempts.dailyResetTime")}
                  type="time"
                  required
                  value={form.dailyResetTime}
                  hint={t("attempts.dailyResetTimeHint")}
                  error={fieldErrors.dailyResetTime}
                  onChange={(value) => update("dailyResetTime", value)}
                />
              </div>
            </Card>

            <Card
              className="bg-surface-muted shadow-none"
              title={t("password.title")}
              description={t("password.description")}
            >
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label={t("password.minLength")}
                    type="number"
                    min={6}
                    max={64}
                    required
                    value={form.minLength}
                    hint={t("password.minLengthHint")}
                    error={fieldErrors.minLength}
                    onChange={(value) => update("minLength", value)}
                  />
                  <TextField
                    label={t("password.maxLength")}
                    type="number"
                    min={6}
                    max={128}
                    required
                    value={form.maxLength}
                    hint={t("password.maxLengthHint")}
                    error={fieldErrors.maxLength}
                    onChange={(value) => update("maxLength", value)}
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    {t("password.complexity")}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <CheckboxField
                      label={t("password.requireUppercase")}
                      checked={form.requireUppercase}
                      onChange={(checked) => update("requireUppercase", checked)}
                    />
                    <CheckboxField
                      label={t("password.requireLowercase")}
                      checked={form.requireLowercase}
                      onChange={(checked) => update("requireLowercase", checked)}
                    />
                    <CheckboxField
                      label={t("password.requireDigit")}
                      checked={form.requireDigit}
                      onChange={(checked) => update("requireDigit", checked)}
                    />
                    <CheckboxField
                      label={t("password.requireSpecial")}
                      checked={form.requireSpecial}
                      onChange={(checked) => update("requireSpecial", checked)}
                    />
                  </div>
                </div>

                <TextField
                  label={t("password.uniquePasswordCount")}
                  type="number"
                  min={0}
                  max={24}
                  required
                  value={form.uniquePasswordCount}
                  hint={t("password.uniquePasswordCountHint")}
                  error={fieldErrors.uniquePasswordCount}
                  onChange={(value) => update("uniquePasswordCount", value)}
                />

                <CheckboxField
                  label={t("password.expirationEnabled")}
                  checked={form.expirationEnabled}
                  onChange={(checked) => update("expirationEnabled", checked)}
                />
                {form.expirationEnabled ? (
                  <TextField
                    label={t("password.expirationDays")}
                    type="number"
                    min={1}
                    max={365}
                    required
                    value={form.expirationDays}
                    hint={t("password.expirationDaysHint")}
                    error={fieldErrors.expirationDays}
                    onChange={(value) => update("expirationDays", value)}
                  />
                ) : null}
              </div>
            </Card>
          </div>

          <div className="btn-actions mt-5 border-t border-border pt-4">
            <Button type="submit" icon={Save} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </Card>
      </form>
    </ModulePageShell>
  );
}
