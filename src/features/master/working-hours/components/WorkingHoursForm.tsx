"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Clock3 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { CheckRow, TextField } from "@/components/ui/Form";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  fetchWorkingHours,
  isWorkingHoursClientError,
  saveWorkingHours,
} from "@/features/master/working-hours/services/working-hours-client";
import { workingHoursUpdateInputSchema } from "@/features/master/working-hours/schemas/working-hours.schema";
import type { WorkingHours } from "@/features/master/working-hours/types/working-hours.types";
import {
  displayToHhmm,
  hhmmToDisplay,
} from "@/features/master/working-hours/utils/time-format";

type FormState = {
  openingDisplay: string;
  closingDisplay: string;
  sessionTimeoutMin: number;
  workingDaysDesc: string;
  allowSundayLogin: boolean;
  lockoutHolidays: boolean;
  allowOfflineCollection: boolean;
};

type LoadStatus =
  | { status: "loading" }
  | { status: "ready"; workingHours: WorkingHours }
  | { status: "empty" }
  | { status: "error"; message: string };

function toFormState(data: WorkingHours): FormState {
  return {
    openingDisplay: hhmmToDisplay(data.openingTime),
    closingDisplay: hhmmToDisplay(data.closingTime),
    sessionTimeoutMin: data.sessionTimeoutMin,
    workingDaysDesc: data.workingDaysDesc ?? "",
    allowSundayLogin: data.allowSundayLogin,
    lockoutHolidays: data.lockoutHolidays,
    allowOfflineCollection: data.allowOfflineCollection,
  };
}

export function WorkingHoursForm() {
  const t = useTranslations("master.workingHours");
  const tErrors = useTranslations("errors");
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadStatus>({ status: "loading" });
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState({ status: "loading" });
      setFormError(null);
      setSuccessMessage(null);

      try {
        const data = await fetchWorkingHours();
        if (cancelled) return;
        if (!data) {
          setLoadState({ status: "empty" });
          return;
        }
        setForm(toFormState(data));
        setLoadState({ status: "ready", workingHours: data });
      } catch (error) {
        if (cancelled) return;
        if (isWorkingHoursClientError(error) && error.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        if (isWorkingHoursClientError(error) && error.status === 404) {
          setLoadState({ status: "empty" });
          return;
        }
        setLoadState({
          status: "error",
          message: isWorkingHoursClientError(error)
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

    const openingTime = displayToHhmm(form.openingDisplay);
    const closingTime = displayToHhmm(form.closingDisplay);
    const nextErrors: Record<string, string> = {};

    if (!openingTime) {
      nextErrors.openingDisplay = t("errors.invalidOpening");
    }
    if (!closingTime) {
      nextErrors.closingDisplay = t("errors.invalidClosing");
    }

    const payload = {
      openingTime: openingTime ?? "",
      closingTime: closingTime ?? "",
      sessionTimeoutMin: form.sessionTimeoutMin,
      workingDaysDesc: form.workingDaysDesc || null,
      allowSundayLogin: form.allowSundayLogin,
      lockoutHolidays: form.lockoutHolidays,
      allowOfflineCollection: form.allowOfflineCollection,
    };

    const parsed = workingHoursUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      if (flat.openingTime?.[0] && !nextErrors.openingDisplay) {
        nextErrors.openingDisplay = flat.openingTime[0];
      }
      if (flat.closingTime?.[0] && !nextErrors.closingDisplay) {
        nextErrors.closingDisplay = flat.closingTime[0];
      }
      if (flat.sessionTimeoutMin?.[0]) {
        nextErrors.sessionTimeoutMin = flat.sessionTimeoutMin[0];
      }
      setFieldErrors(nextErrors);
      setFormError(t("validationFailed"));
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(t("validationFailed"));
      return;
    }

    setSaving(true);
    try {
      const updated = await saveWorkingHours(parsed.data);
      setForm(toFormState(updated));
      setLoadState({ status: "ready", workingHours: updated });
      setSuccessMessage(t("saveSuccess"));
    } catch (error) {
      if (isWorkingHoursClientError(error) && error.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      if (isWorkingHoursClientError(error) && error.status === 422) {
        setFormError(error.message || t("validationFailed"));
        const details = error.details as
          | { fieldErrors?: Record<string, string[]> }
          | undefined;
        if (details?.fieldErrors) {
          const mapped: Record<string, string> = {};
          if (details.fieldErrors.openingTime?.[0]) {
            mapped.openingDisplay = details.fieldErrors.openingTime[0];
          }
          if (details.fieldErrors.closingTime?.[0]) {
            mapped.closingDisplay = details.fieldErrors.closingTime[0];
          }
          if (details.fieldErrors.sessionTimeoutMin?.[0]) {
            mapped.sessionTimeoutMin = details.fieldErrors.sessionTimeoutMin[0];
          }
          setFieldErrors(mapped);
        }
        return;
      }
      setFormError(
        isWorkingHoursClientError(error) ? error.message : tErrors("generic"),
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

  if (loadState.status === "empty" || !form) {
    return (
      <EmptyState title={t("emptyTitle")} message={t("emptyMessage")} />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <form
        id="working-hours-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <Card title={t("sectionTitle")} description={t("sectionHint")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label={t("fields.openingTime")}
              value={form.openingDisplay}
              placeholder="08:00 AM"
              error={fieldErrors.openingDisplay}
              onChange={(value) => updateField("openingDisplay", value)}
            />
            <TextField
              label={t("fields.closingTime")}
              value={form.closingDisplay}
              placeholder="07:30 PM"
              error={fieldErrors.closingDisplay}
              onChange={(value) => updateField("closingDisplay", value)}
            />
            <TextField
              label={t("fields.sessionTimeoutMin")}
              type="number"
              min={1}
              max={1440}
              value={form.sessionTimeoutMin}
              error={fieldErrors.sessionTimeoutMin}
              onChange={(value) =>
                updateField("sessionTimeoutMin", Number(value) || 0)
              }
            />
            <TextField
              label={t("fields.workingDaysDesc")}
              value={form.workingDaysDesc}
              onChange={(value) => updateField("workingDaysDesc", value)}
            />
          </div>

          <div className="mt-4 space-y-2 rounded-2xl bg-surface-muted px-4 py-3">
            <CheckRow
              checked={form.allowSundayLogin}
              label={t("fields.allowSundayLogin")}
              onChange={(checked) => updateField("allowSundayLogin", checked)}
            />
            <CheckRow
              checked={form.lockoutHolidays}
              label={t("fields.lockoutHolidays")}
              onChange={(checked) => updateField("lockoutHolidays", checked)}
            />
            <CheckRow
              checked={form.allowOfflineCollection}
              label={t("fields.allowOfflineCollection")}
              onChange={(checked) =>
                updateField("allowOfflineCollection", checked)
              }
            />
          </div>

          <div className="btn-actions mt-4">
            <Button type="submit" disabled={saving} icon={Clock3}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
