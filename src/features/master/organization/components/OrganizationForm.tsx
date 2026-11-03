"use client";

import { useEffect, useState, useSyncExternalStore, type ChangeEvent, type FormEvent } from "react";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  CheckboxField,
  FormField,
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
import {
  getOrganizationSnapshot,
  subscribeOrganizationCache,
  writeOrganizationCache,
} from "@/features/master/organization/services/organization-cache";
import { organizationUpdateInputSchema } from "@/features/master/organization/schemas/organization.schema";
import {
  cinPattern,
  formatIssue,
  gstinPattern,
  panPattern,
  phonePattern,
  tanPattern,
} from "@/lib/validation/formats";
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
  const cached = useSyncExternalStore(
    subscribeOrganizationCache,
    getOrganizationSnapshot,
    () => null,
  );
  const [preview, setPreview] = useState<UiPreview>(null);

  const [loadState, setLoadState] = useState<LoadStatus>({ status: "loading" });
  const [form, setForm] = useState<FormState | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [logoMode, setLogoMode] = useState<LogoMode>("keep");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useToastText();
  const [successMessage, setSuccessMessage] = useToastText();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    setPreview(getDevUiPreview());
  }, []);

  useEffect(() => {
    if (preview === "pending" || preview) return;

    let cancelled = false;

    async function load() {
      const cachedNow = getOrganizationSnapshot();
      if (!cachedNow) setLoadState({ status: "loading" });
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
        writeOrganizationCache(organization, stateResult.items);
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
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setFieldErrors({ orgLogo: [t("errors.orgLogo")] });
      event.target.value = "";
      return;
    }
    setFieldErrors((prev) => {
      if (!prev.orgLogo) return prev;
      const next = { ...prev };
      delete next.orgLogo;
      return next;
    });
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
    if (logoMode === "replace" && !logoBase64) {
      setFieldErrors({ orgLogo: [t("errors.orgLogo")] });
      setFormError(t("validationFailed"));
      return;
    }

    const parsed = organizationUpdateInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string[]> = {};
      for (const key of Object.keys(flat)) {
        if (flat[key as keyof typeof flat]?.length) {
          next[key] = [t(`errors.${key}` as "errors.orgDispNm")];
        }
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

  if (
    cached &&
    preview == null &&
    loadState.status === "loading" &&
    form == null
  ) {
    setLoadState({ status: "ready", organization: cached.organization });
    setForm(organizationToForm(cached.organization));
    setStates(cached.states);
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

  if (
    preview === "loading" ||
    (loadState.status === "loading" && form == null)
  ) {
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
      <PageToast message={successMessage} />

      <PageToast message={formError} tone="error" />

      <form
        id="organization-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="flex min-w-0 flex-col gap-4 sm:gap-5"
      >
        <Card title={t("title")} description={t("description")}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label={t("fields.orgDispNm")}
              required
              value={form.orgDispNm}
              maxLength={200}
              hint={t("hints.orgDispNm")}
              error={fieldErrors.orgDispNm?.[0]}
              validate={(value, final) =>
                final && !value.trim() ? t("errors.orgDispNm") : undefined
              }
              onChange={(value) => updateField("orgDispNm", value)}
            />
            <TextField
              label={t("fields.legalName")}
              value={form.legalName}
              maxLength={200}
              error={fieldErrors.legalName?.[0]}
              onChange={(value) => updateField("legalName", value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              label={t("fields.cinNo")}
              value={form.cinNo}
              maxLength={21}
              restrict="code"
              hint={t("hints.cinNo")}
              error={fieldErrors.cinNo?.[0]}
              validate={(value, final) =>
                formatIssue(value, final, 21, cinPattern, t("errors.cinNo"))
              }
              onChange={(value) => updateField("cinNo", value)}
            />
            <TextField
              label={t("fields.regdNo")}
              value={form.regdNo}
              maxLength={50}
              error={fieldErrors.regdNo?.[0]}
              onChange={(value) => updateField("regdNo", value)}
            />
            <TextField
              label={t("fields.gstNo")}
              value={form.gstNo}
              maxLength={15}
              restrict="code"
              hint={t("hints.gstNo")}
              error={fieldErrors.gstNo?.[0]}
              validate={(value, final) =>
                formatIssue(value, final, 15, gstinPattern, t("errors.gstNo"))
              }
              onChange={(value) => updateField("gstNo", value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              label={t("fields.panNo")}
              value={form.panNo}
              maxLength={10}
              restrict="code"
              hint={t("hints.panNo")}
              error={fieldErrors.panNo?.[0]}
              validate={(value, final) =>
                formatIssue(value, final, 10, panPattern, t("errors.panNo"))
              }
              onChange={(value) => updateField("panNo", value)}
            />
            <TextField
              label={t("fields.tanNo")}
              value={form.tanNo}
              maxLength={10}
              restrict="code"
              hint={t("hints.tanNo")}
              error={fieldErrors.tanNo?.[0]}
              validate={(value, final) =>
                formatIssue(value, final, 10, tanPattern, t("errors.tanNo"))
              }
              onChange={(value) => updateField("tanNo", value)}
            />
            <SelectField
              label={t("fields.stateCd")}
              value={form.stateCd}
              error={fieldErrors.stateCd?.[0]}
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
              maxLength={500}
              error={fieldErrors.regdAddress?.[0]}
              onChange={(value) => updateField("regdAddress", value)}
            />
            <TextAreaField
              label={t("fields.hoAddress")}
              value={form.hoAddress}
              maxLength={500}
              error={fieldErrors.hoAddress?.[0]}
              onChange={(value) => updateField("hoAddress", value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <TextField
              label={t("fields.email")}
              type="email"
              value={form.email}
              maxLength={100}
              hint={t("hints.email")}
              error={fieldErrors.email?.[0]}
              validate={(value, final) => {
                const trimmed = value.trim();
                if (!trimmed) return undefined;
                const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
                if (!final && !/@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
                return ok ? undefined : t("errors.email");
              }}
              onChange={(value) => updateField("email", value)}
            />
            <TextField
              label={t("fields.phone")}
              type="tel"
              value={form.phone}
              maxLength={16}
              hint={t("hints.phone")}
              error={fieldErrors.phone?.[0]}
              validate={(value, final) => {
                const compact = value.replace(/[\s-]/g, "");
                if (!compact) return undefined;
                if (!final && compact.replace(/\D/g, "").length < 6) return undefined;
                return phonePattern.test(compact) ? undefined : t("errors.phone");
              }}
              onChange={(value) => updateField("phone", value)}
            />
            <TextField
              label={t("fields.website")}
              value={form.website}
              maxLength={200}
              hint={t("hints.website")}
              error={fieldErrors.website?.[0]}
              validate={(value, final) => {
                const trimmed = value.trim();
                if (!trimmed) return undefined;
                const ok = /^https?:\/\/\S+$/i.test(trimmed);
                if (!final && trimmed.length < 8) return undefined;
                return ok ? undefined : t("errors.website");
              }}
              onChange={(value) => updateField("website", value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <CheckboxField
              label={t("fields.isActive")}
              checked={form.isActive}
              onChange={(checked) => updateField("isActive", checked)}
            />

            <FormField
              label={t("fields.orgLogo")}
              error={fieldErrors.orgLogo?.[0]}
              className="rounded-xl border border-border bg-surface-muted/50 p-3"
            >
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
            </FormField>
          </div>

          <div className="btn-actions mt-5 border-t border-border pt-4">
            <Button type="submit" disabled={saving} icon={Save}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
