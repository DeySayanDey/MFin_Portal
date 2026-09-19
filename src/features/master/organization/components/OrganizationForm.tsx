"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/Form";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  fetchOrganization,
  fetchStates,
  isOrganizationClientError,
  saveOrganization,
} from "@/features/master/organization/services/organization-client";
import { organizationUpdateInputSchema } from "@/features/master/organization/schemas/organization.schema";
import type {
  Organization,
  OrganizationUpdateInput,
  State,
} from "@/features/master/organization/types/organization.types";

/** Dev-only UI state previews: `?preview=error|loading|empty` */
type UiPreview = "error" | "loading" | "empty" | null;

function readUiPreview(value: string | null): UiPreview {
  if (process.env.NODE_ENV !== "development") return null;
  if (value === "error" || value === "loading" || value === "empty") {
    return value;
  }
  return null;
}

function getDevUiPreview(): UiPreview {
  if (typeof window === "undefined") return null;
  return readUiPreview(new URLSearchParams(window.location.search).get("preview"));
}

type FormState = {
  orgDispNm: string;
  legalName: string;
  regdAddress: string;
  hoAddress: string;
  stateCd: string;
  phone: string;
  email: string;
  website: string;
  cinNo: string;
  regdNo: string;
  gstNo: string;
  panNo: string;
  tanNo: string;
  isActive: boolean;
};

type LogoMode = "keep" | "clear" | "replace";

type LoadStatus =
  | { status: "loading" }
  | { status: "ready"; organization: Organization }
  | { status: "empty" }
  | { status: "error"; message: string };

function organizationToForm(org: Organization): FormState {
  return {
    orgDispNm: org.orgDispNm ?? "",
    legalName: org.legalName ?? "",
    regdAddress: org.regdAddress ?? "",
    hoAddress: org.hoAddress ?? "",
    stateCd: org.stateCd != null ? String(org.stateCd) : "",
    phone: org.phone ?? "",
    email: org.email ?? "",
    website: org.website ?? "",
    cinNo: org.cinNo ?? "",
    regdNo: org.regdNo ?? "",
    gstNo: org.gstNo ?? "",
    panNo: org.panNo ?? "",
    tanNo: org.tanNo ?? "",
    isActive: org.isActive,
  };
}

function buildUpdatePayload(
  form: FormState,
  logoMode: LogoMode,
  logoBase64: string | null,
): OrganizationUpdateInput {
  return {
    orgDispNm: form.orgDispNm,
    legalName: form.legalName || null,
    regdAddress: form.regdAddress || null,
    hoAddress: form.hoAddress || null,
    stateCd: form.stateCd ? Number(form.stateCd) : null,
    phone: form.phone || null,
    email: form.email || null,
    website: form.website || null,
    cinNo: form.cinNo || null,
    regdNo: form.regdNo || null,
    gstNo: form.gstNo || null,
    panNo: form.panNo || null,
    tanNo: form.tanNo || null,
    isActive: form.isActive,
    ...(logoMode === "keep"
      ? {}
      : logoMode === "clear"
        ? { orgLogo: "" }
        : { orgLogo: logoBase64 ?? "" }),
  };
}

export function OrganizationForm() {
  const t = useTranslations("master.organization");
  const tErrors = useTranslations("errors");
  const tUi = useTranslations("ui");
  const router = useRouter();
  /** `pending` only in development until `?preview=` is read from the URL. */
  const [preview, setPreview] = useState<UiPreview | "pending">(() =>
    process.env.NODE_ENV === "development" ? "pending" : null,
  );

  const [loadState, setLoadState] = useState<LoadStatus>({ status: "loading" });
  const [form, setForm] = useState<FormState | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [logoMode, setLogoMode] = useState<LogoMode>("keep");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    setPreview(getDevUiPreview());
  }, []);

  useEffect(() => {
    if (preview === "pending" || preview) return;

    let cancelled = false;

    async function load() {
      setLoadState({ status: "loading" });
      setFormError(null);
      setSuccessMessage(null);

      try {
        const [organization, stateResult] = await Promise.all([
          fetchOrganization(),
          fetchStates({ page: 1, perPage: 200 }).catch((error: unknown) => {
            if (isOrganizationClientError(error) && error.status === 401) {
              throw error;
            }
            if (!cancelled) {
              setStatesError(
                isOrganizationClientError(error)
                  ? error.message
                  : tErrors("generic"),
              );
            }
            return { items: [] as State[], meta: null };
          }),
        ]);

        if (cancelled) return;

        if (!organization) {
          setLoadState({ status: "empty" });
          return;
        }

        setStates(stateResult.items);
        setForm(organizationToForm(organization));
        setLogoMode("keep");
        setLogoBase64(null);
        setLoadState({ status: "ready", organization });
      } catch (error) {
        if (cancelled) return;
        if (isOrganizationClientError(error) && error.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setLoadState({
          status: "error",
          message: isOrganizationClientError(error)
            ? error.message
            : tErrors("generic"),
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [preview, router, tErrors]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setLogoBase64(result);
      setLogoMode("replace");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setFormError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const payload = buildUpdatePayload(form, logoMode, logoBase64);
    const parsed = organizationUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string[]> = {};
      for (const [key, messages] of Object.entries(flat)) {
        if (messages && messages.length > 0) next[key] = messages;
      }
      setFieldErrors(next);
      setFormError(t("validationFailed"));
      return;
    }

    setSaving(true);
    try {
      const updated = await saveOrganization(parsed.data);
      setForm(organizationToForm(updated));
      setLoadState({ status: "ready", organization: updated });
      setLogoMode("keep");
      setLogoBase64(null);
      setSuccessMessage(t("saveSuccess"));
    } catch (error) {
      if (isOrganizationClientError(error) && error.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      if (isOrganizationClientError(error) && error.status === 422) {
        setFormError(error.message || t("validationFailed"));
        if (error.details && typeof error.details === "object") {
          const details = error.details as {
            fieldErrors?: Record<string, string[]>;
            formErrors?: string[];
          };
          if (details.fieldErrors) setFieldErrors(details.fieldErrors);
        }
        return;
      }
      setFormError(
        isOrganizationClientError(error) ? error.message : tErrors("generic"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (preview === "pending") {
    return <LoadingState title={t("loading")} />;
  }

  if (preview === "error") {
    return (
      <ErrorState
        title={t("loadErrorTitle")}
        message={tErrors("timeout")}
        onRetry={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  if (preview === "empty") {
    return (
      <EmptyState title={t("emptyTitle")} message={t("emptyMessage")} />
    );
  }

  if (preview === "loading" || loadState.status === "loading") {
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

  const organization = loadState.organization;

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <form
        id="organization-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="flex min-w-0 flex-col gap-4 sm:gap-5"
      >
        <Card
          title={t("sectionIdentity")}
          description={t("sectionIdentityHint")}
          trailing={
            <span className="w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink">
              {organization.orgSchema}
            </span>
          }
        >

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label={t("fields.orgSchema")}
              value={organization.orgSchema}
              readOnly
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label={t("fields.orgDispNm")}
              required
              value={form.orgDispNm}
              error={fieldErrors.orgDispNm?.[0]}
              onChange={(value) => updateField("orgDispNm", value)}
            />
            <TextField
              label={t("fields.legalName")}
              value={form.legalName}
              onChange={(value) => updateField("legalName", value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              label={t("fields.cinNo")}
              value={form.cinNo}
              onChange={(value) => updateField("cinNo", value)}
            />
            <TextField
              label={t("fields.regdNo")}
              value={form.regdNo}
              onChange={(value) => updateField("regdNo", value)}
            />
            <TextField
              label={t("fields.gstNo")}
              value={form.gstNo}
              onChange={(value) => updateField("gstNo", value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              label={t("fields.panNo")}
              value={form.panNo}
              onChange={(value) => updateField("panNo", value)}
            />
            <TextField
              label={t("fields.tanNo")}
              value={form.tanNo}
              onChange={(value) => updateField("tanNo", value)}
            />
            <SelectField
              label={t("fields.stateCd")}
              value={form.stateCd}
              onChange={(value) => updateField("stateCd", value)}
              placeholder={t("fields.statePlaceholder")}
              searchPlaceholder={tUi("selectSearch")}
              emptyMessage={tUi("selectEmpty")}
              hint={statesError ? t("statesLoadWarning") : undefined}
              options={[
                { value: "", label: t("fields.statePlaceholder") },
                ...states.map((state) => ({
                  value: String(state.stateCd),
                  label: state.stateName,
                })),
              ]}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextAreaField
              label={t("fields.regdAddress")}
              value={form.regdAddress}
              onChange={(value) => updateField("regdAddress", value)}
            />
            <TextAreaField
              label={t("fields.hoAddress")}
              value={form.hoAddress}
              onChange={(value) => updateField("hoAddress", value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              label={t("fields.email")}
              value={form.email}
              error={fieldErrors.email?.[0]}
              onChange={(value) => updateField("email", value)}
            />
            <TextField
              label={t("fields.phone")}
              value={form.phone}
              onChange={(value) => updateField("phone", value)}
            />
            <TextField
              label={t("fields.website")}
              value={form.website}
              onChange={(value) => updateField("website", value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <CheckboxField
              label={t("fields.isActive")}
              checked={form.isActive}
              onChange={(checked) => updateField("isActive", checked)}
            />

            <div className="space-y-2 rounded-xl border border-border bg-surface-muted/50 p-3">
              <p className="text-xs font-semibold text-slate-600">
                {t("fields.orgLogo")}
              </p>
              {organization.orgLogo && logoMode === "keep" ? (
                // eslint-disable-next-line @next/next/no-img-element -- org logo may be base64 from API
                <img
                  src={organization.orgLogo}
                  alt={t("fields.orgLogo")}
                  className="mb-2 h-16 w-16 rounded-lg border border-border object-contain bg-white"
                />
              ) : null}
              <div className="flex flex-wrap gap-3 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="logoMode"
                    checked={logoMode === "keep"}
                    onChange={() => {
                      setLogoMode("keep");
                      setLogoBase64(null);
                    }}
                  />
                  {t("logoKeep")}
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="logoMode"
                    checked={logoMode === "clear"}
                    onChange={() => {
                      setLogoMode("clear");
                      setLogoBase64(null);
                    }}
                  />
                  {t("logoClear")}
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="logoMode"
                    checked={logoMode === "replace"}
                    onChange={() => setLogoMode("replace")}
                  />
                  {t("logoReplace")}
                </label>
              </div>
              {logoMode === "replace" ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleLogoFile(event)}
                  className="block w-full text-xs text-muted"
                />
              ) : null}
              {logoBase64 && logoMode === "replace" ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview of uploaded base64
                <img
                  src={logoBase64}
                  alt={t("fields.orgLogo")}
                  className="mt-2 h-16 w-16 rounded-lg border border-border object-contain bg-white"
                />
              ) : null}
              {organization.orgLogo && logoMode === "keep" ? (
                <p className="text-xs text-muted">{t("logoPresent")}</p>
              ) : null}
              {!organization.orgLogo && logoMode === "keep" ? (
                <p className="text-xs text-muted">{t("logoEmpty")}</p>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="btn-actions">
          <Button type="submit" disabled={saving} icon={Save}>
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
