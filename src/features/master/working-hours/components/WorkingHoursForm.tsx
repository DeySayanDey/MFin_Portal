"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Clock3 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Form";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
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
  isValidHhmm,
} from "@/features/master/working-hours/utils/time-format";

type FormState = {
  sodDisplay: string;
  eodDisplay: string;
  batchDisplay: string;
  sessionIncTime: string;
};

type LoadStatus =
  | { status: "loading" }
  | { status: "ready"; workingHours: WorkingHours | null }
  | { status: "error"; message: string };

const EMPTY_FORM: FormState = {
  sodDisplay: "08:00 AM",
  eodDisplay: "07:30 PM",
  batchDisplay: "10:00 PM",
  sessionIncTime: "00:30",
};

function toFormState(data: WorkingHours): FormState {
  return {
    sodDisplay: hhmmToDisplay(data.sodTime),
    eodDisplay: hhmmToDisplay(data.eodTime),
    batchDisplay: data.batchExeTime ? hhmmToDisplay(data.batchExeTime) : "",
    sessionIncTime: data.sessionIncTime,
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
  const [formError, setFormError] = useToastText();
  const [successMessage, setSuccessMessage] = useToastText();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState({ status: "loading" });
      setFormError(null);
      setSuccessMessage(null);

      try {
        const data = await fetchWorkingHours();
        if (cancelled) return;
        setForm(toFormState(data));
        setLoadState({ status: "ready", workingHours: data });
      } catch (error) {
        if (cancelled) return;
        if (isWorkingHoursClientError(error) && error.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        // Upsert: allow first-time configure when Laravel has no row yet.
        if (isWorkingHoursClientError(error) && error.status === 404) {
          setForm(EMPTY_FORM);
          setLoadState({ status: "ready", workingHours: null });
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

    const sodTime = displayToHhmm(form.sodDisplay);
    const eodTime = displayToHhmm(form.eodDisplay);
    const batchRaw = form.batchDisplay.trim();
    const batchExeTime = batchRaw
      ? displayToHhmm(batchRaw) ?? (isValidHhmm(batchRaw) ? batchRaw : null)
      : null;
    const sessionIncTime = form.sessionIncTime.trim();
    const nextErrors: Record<string, string> = {};

    if (!sodTime) {
      nextErrors.sodDisplay = t("errors.invalidSod");
    }
    if (!eodTime) {
      nextErrors.eodDisplay = t("errors.invalidEod");
    }
    if (batchRaw && !batchExeTime) {
      nextErrors.batchDisplay = t("errors.invalidBatch");
    }
    if (!isValidHhmm(sessionIncTime)) {
      nextErrors.sessionIncTime = t("errors.invalidSession");
    }

    const payload = {
      sodTime: sodTime ?? "",
      eodTime: eodTime ?? "",
      batchExeTime,
      sessionIncTime,
    };

    const parsed = workingHoursUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      if (flat.sodTime?.[0] && !nextErrors.sodDisplay) {
        nextErrors.sodDisplay = flat.sodTime[0];
      }
      if (flat.eodTime?.[0] && !nextErrors.eodDisplay) {
        nextErrors.eodDisplay = flat.eodTime[0];
      }
      if (flat.batchExeTime?.[0] && !nextErrors.batchDisplay) {
        nextErrors.batchDisplay = flat.batchExeTime[0];
      }
      if (flat.sessionIncTime?.[0] && !nextErrors.sessionIncTime) {
        nextErrors.sessionIncTime = flat.sessionIncTime[0];
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
      const updated = await saveWorkingHours({
        ...parsed.data,
        batchExeTime: parsed.data.batchExeTime || null,
      });
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
          if (details.fieldErrors.sodTime?.[0]) {
            mapped.sodDisplay = details.fieldErrors.sodTime[0];
          }
          if (details.fieldErrors.eodTime?.[0]) {
            mapped.eodDisplay = details.fieldErrors.eodTime[0];
          }
          if (details.fieldErrors.batchExeTime?.[0]) {
            mapped.batchDisplay = details.fieldErrors.batchExeTime[0];
          }
          if (details.fieldErrors.sessionIncTime?.[0]) {
            mapped.sessionIncTime = details.fieldErrors.sessionIncTime[0];
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

  if (!form) {
    return <LoadingState title={t("loading")} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <PageToast message={successMessage} />

      <PageToast message={formError} tone="error" />

      {loadState.status === "ready" && loadState.workingHours == null ? (
        <Alert tone="info">{t("notConfiguredHint")}</Alert>
      ) : null}

      <form
        id="working-hours-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <Card title={t("title")} description={t("description")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label={t("fields.sodTime")}
              value={form.sodDisplay}
              placeholder="08:00 AM"
              required
              error={fieldErrors.sodDisplay}
              onChange={(value) => updateField("sodDisplay", value)}
            />
            <TextField
              label={t("fields.eodTime")}
              value={form.eodDisplay}
              placeholder="07:30 PM"
              required
              error={fieldErrors.eodDisplay}
              onChange={(value) => updateField("eodDisplay", value)}
            />
            <TextField
              label={t("fields.batchExeTime")}
              value={form.batchDisplay}
              placeholder="10:00 PM"
              error={fieldErrors.batchDisplay}
              onChange={(value) => updateField("batchDisplay", value)}
            />
            <TextField
              label={t("fields.sessionIncTime")}
              value={form.sessionIncTime}
              placeholder="00:30"
              required
              hint={t("hints.sessionIncTime")}
              error={fieldErrors.sessionIncTime}
              onChange={(value) => updateField("sessionIncTime", value)}
            />
          </div>

          <div className="btn-actions mt-5 border-t border-border pt-4">
            <Button type="submit" disabled={saving} icon={Clock3}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
