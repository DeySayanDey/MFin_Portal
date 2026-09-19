"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { CheckRow, TextField } from "@/components/ui/Form";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  fetchRbiLendingPolicy,
  isRbiLendingPolicyClientError,
  saveRbiLendingPolicy,
} from "@/features/master/rbi-lending-policy/services/rbi-lending-policy-client";
import { rbiLendingPolicyUpdateInputSchema } from "@/features/master/rbi-lending-policy/schemas/rbi-lending-policy.schema";
import {
  RBI_LENDING_POLICY_DEFAULTS,
  type RbiLendingPolicy,
  type RbiLendingPolicyUpdateInput,
} from "@/features/master/rbi-lending-policy/types/rbi-lending-policy.types";

type FormState = {
  maxAnnualHouseholdIncome: number;
  maxFoirPct: number;
  minJlgMembers: number;
  maxJlgMembers: number;
  maxSanction1stCycle: number;
  maxSanction2ndCycle: number;
  mandatoryPennyDrop: boolean;
  mandatoryBureauCheck: boolean;
  allowPrepaymentPenalty: boolean;
};

type LoadStatus =
  | { status: "loading" }
  | { status: "ready"; policy: RbiLendingPolicy | null }
  | { status: "error"; message: string };

function toFormState(
  data: RbiLendingPolicy | RbiLendingPolicyUpdateInput,
): FormState {
  return {
    maxAnnualHouseholdIncome: data.maxAnnualHouseholdIncome,
    maxFoirPct: data.maxFoirPct,
    minJlgMembers: data.minJlgMembers,
    maxJlgMembers: data.maxJlgMembers,
    maxSanction1stCycle: data.maxSanction1stCycle,
    maxSanction2ndCycle: data.maxSanction2ndCycle,
    mandatoryPennyDrop: data.mandatoryPennyDrop ?? true,
    mandatoryBureauCheck: data.mandatoryBureauCheck ?? true,
    allowPrepaymentPenalty: data.allowPrepaymentPenalty ?? false,
  };
}

function parsePositiveInt(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

export function RbiLendingPolicyForm() {
  const t = useTranslations("master.rbiLendingPolicy");
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
        const data = await fetchRbiLendingPolicy();
        if (cancelled) return;
        setForm(toFormState(data));
        setLoadState({ status: "ready", policy: data });
      } catch (error) {
        if (cancelled) return;
        if (isRbiLendingPolicyClientError(error) && error.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        if (isRbiLendingPolicyClientError(error) && error.status === 404) {
          setForm(toFormState(RBI_LENDING_POLICY_DEFAULTS));
          setLoadState({ status: "ready", policy: null });
          return;
        }
        setLoadState({
          status: "error",
          message: isRbiLendingPolicyClientError(error)
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

    const payload: RbiLendingPolicyUpdateInput = {
      maxAnnualHouseholdIncome: form.maxAnnualHouseholdIncome,
      maxFoirPct: form.maxFoirPct,
      minJlgMembers: form.minJlgMembers,
      maxJlgMembers: form.maxJlgMembers,
      maxSanction1stCycle: form.maxSanction1stCycle,
      maxSanction2ndCycle: form.maxSanction2ndCycle,
      mandatoryPennyDrop: form.mandatoryPennyDrop,
      mandatoryBureauCheck: form.mandatoryBureauCheck,
      allowPrepaymentPenalty: form.allowPrepaymentPenalty,
    };

    const parsed = rbiLendingPolicyUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const mapped: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flat)) {
        if (messages?.[0]) mapped[key] = messages[0];
      }
      setFieldErrors(mapped);
      setFormError(t("validationFailed"));
      return;
    }

    setSaving(true);
    try {
      const updated = await saveRbiLendingPolicy(parsed.data);
      setForm(toFormState(updated));
      setLoadState({ status: "ready", policy: updated });
      setSuccessMessage(t("saveSuccess"));
    } catch (error) {
      if (isRbiLendingPolicyClientError(error) && error.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      if (isRbiLendingPolicyClientError(error) && error.status === 422) {
        setFormError(error.message || t("validationFailed"));
        const details = error.details as
          | { fieldErrors?: Record<string, string[]> }
          | undefined;
        if (details?.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(details.fieldErrors)) {
            if (messages?.[0]) mapped[key] = messages[0];
          }
          setFieldErrors(mapped);
        }
        return;
      }
      setFormError(
        isRbiLendingPolicyClientError(error)
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
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      {loadState.policy === null ? (
        <Alert tone="info">{t("notConfiguredHint")}</Alert>
      ) : null}

      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <form
        id="rbi-lending-policy-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <Card title={t("sectionTitle")} description={t("sectionHint")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label={t("fields.maxAnnualHouseholdIncome")}
              type="number"
              min={1}
              required
              value={form.maxAnnualHouseholdIncome}
              hint={t("hints.maxAnnualHouseholdIncome")}
              error={fieldErrors.maxAnnualHouseholdIncome}
              onChange={(value) =>
                updateField("maxAnnualHouseholdIncome", parsePositiveInt(value))
              }
            />
            <TextField
              label={t("fields.maxFoirPct")}
              type="number"
              min={1}
              max={100}
              required
              value={form.maxFoirPct}
              hint={t("hints.maxFoirPct")}
              error={fieldErrors.maxFoirPct}
              onChange={(value) =>
                updateField("maxFoirPct", parsePositiveInt(value))
              }
            />
            <TextField
              label={t("fields.minJlgMembers")}
              type="number"
              min={1}
              required
              value={form.minJlgMembers}
              error={fieldErrors.minJlgMembers}
              onChange={(value) =>
                updateField("minJlgMembers", parsePositiveInt(value))
              }
            />
            <TextField
              label={t("fields.maxJlgMembers")}
              type="number"
              min={1}
              required
              value={form.maxJlgMembers}
              error={fieldErrors.maxJlgMembers}
              onChange={(value) =>
                updateField("maxJlgMembers", parsePositiveInt(value))
              }
            />
            <TextField
              label={t("fields.maxSanction1stCycle")}
              type="number"
              min={1}
              required
              value={form.maxSanction1stCycle}
              error={fieldErrors.maxSanction1stCycle}
              onChange={(value) =>
                updateField("maxSanction1stCycle", parsePositiveInt(value))
              }
            />
            <TextField
              label={t("fields.maxSanction2ndCycle")}
              type="number"
              min={1}
              required
              value={form.maxSanction2ndCycle}
              error={fieldErrors.maxSanction2ndCycle}
              onChange={(value) =>
                updateField("maxSanction2ndCycle", parsePositiveInt(value))
              }
            />
          </div>

          <div className="mt-4 space-y-2 rounded-2xl bg-surface-muted px-4 py-3">
            <CheckRow
              checked={form.mandatoryPennyDrop}
              label={t("fields.mandatoryPennyDrop")}
              onChange={(checked) =>
                updateField("mandatoryPennyDrop", checked)
              }
            />
            <CheckRow
              checked={form.mandatoryBureauCheck}
              label={t("fields.mandatoryBureauCheck")}
              onChange={(checked) =>
                updateField("mandatoryBureauCheck", checked)
              }
            />
            <CheckRow
              checked={form.allowPrepaymentPenalty}
              label={t("fields.allowPrepaymentPenalty")}
              onChange={(checked) =>
                updateField("allowPrepaymentPenalty", checked)
              }
            />
          </div>

          <div className="btn-actions mt-4">
            <Button type="submit" disabled={saving} icon={Scale}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
