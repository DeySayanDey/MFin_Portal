"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  fetchOrganization,
  isOrganizationClientError,
} from "@/features/master/organization/services/organization-client";
import {
  getOrganizationSnapshot,
  subscribeOrganizationCache,
  writeOrganizationCache,
} from "@/features/master/organization/services/organization-cache";
import type { Organization } from "@/features/master/organization/types/organization.types";

type UiPreview = "error" | "loading" | "empty" | null;
type LoadStatus =
  | { status: "loading" }
  | { status: "ready"; organization: Organization }
  | { status: "empty" }
  | { status: "error"; message: string };

export function OrganizationForm() {
  const t = useTranslations("master.organization");
  const tErrors = useTranslations("errors");
  const tStatus = useTranslations("confirmDialog");
  const router = useRouter();
  const cached = useSyncExternalStore(
    subscribeOrganizationCache,
    getOrganizationSnapshot,
    () => null,
  );
  const [preview, setPreview] = useState<UiPreview>(null);
  const [loadState, setLoadState] = useState<LoadStatus>({ status: "loading" });

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const value = new URLSearchParams(window.location.search).get("preview");
    if (value === "error" || value === "loading" || value === "empty") setPreview(value);
  }, []);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;

    async function load() {
      try {
        const organization = await fetchOrganization();
        if (cancelled) return;
        if (!organization) {
          setLoadState({ status: "empty" });
          return;
        }
        setLoadState({ status: "ready", organization });
        writeOrganizationCache(organization, getOrganizationSnapshot()?.states ?? []);
      } catch (error) {
        if (cancelled) return;
        if (isOrganizationClientError(error) && error.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setLoadState({
          status: "error",
          message: isOrganizationClientError(error) ? error.message : tErrors("generic"),
        });
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [preview, router, tErrors]);

  if (preview === "error") {
    return <ErrorState title={t("loadErrorTitle")} message={tErrors("timeout")} onRetry={() => window.location.reload()} />;
  }
  if (preview === "empty") return <EmptyState title={t("emptyTitle")} message={t("emptyMessage")} />;
  if (preview === "loading") return <LoadingState title={t("loading")} />;
  if (loadState.status === "error") {
    return <ErrorState title={t("loadErrorTitle")} message={loadState.message} onRetry={() => window.location.reload()} />;
  }
  if (loadState.status === "empty") return <EmptyState title={t("emptyTitle")} message={t("emptyMessage")} />;

  const organization = loadState.status === "ready" ? loadState.organization : cached?.organization;
  if (!organization) return <LoadingState title={t("loading")} />;

  const fields = [
    [t("fields.orgDispNm"), organization.orgDispNm],
    [t("fields.legalName"), organization.legalName],
    [t("fields.cinNo"), organization.cinNo],
    [t("fields.regdNo"), organization.regdNo],
    [t("fields.gstNo"), organization.gstNo],
    [t("fields.panNo"), organization.panNo],
    [t("fields.tanNo"), organization.tanNo],
    [t("fields.stateCd"), organization.stateName ?? cached?.states.find((state) => state.stateCd === organization.stateCd)?.stateName ?? (organization.stateCd != null ? String(organization.stateCd) : null)],
    [t("fields.regdAddress"), organization.regdAddress],
    [t("fields.hoAddress"), organization.hoAddress],
    [t("fields.email"), organization.email],
    [t("fields.phone"), organization.phone],
    [t("fields.website"), organization.website],
    [t("fields.isActive"), organization.isActive ? tStatus("statusActive") : tStatus("statusInactive")],
  ];

  return (
    <Card title={t("title")} description={t("description")}>
      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-semibold text-slate-600">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{value || "—"}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs font-semibold text-slate-600">{t("fields.orgLogo")}</dt>
          <dd className="mt-1">
            {organization.orgLogo ? (
              // eslint-disable-next-line @next/next/no-img-element -- org logo may be base64 from API
              <img src={organization.orgLogo} alt={t("fields.orgLogo")} className="h-16 w-16 rounded-lg border border-border bg-white object-contain" />
            ) : <span className="text-sm text-muted">{t("logoEmpty")}</span>}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

