"use client";

import { useEffect, useMemo, useState } from "react";
import { FileCheck2, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { SpecimenSignatoryPanel } from "./SpecimenSignatoryPanel";
import { MemberKycModal } from "@/features/onboarding/member-kyc/components/MemberKycModal";
import { MemberRegistrationTable } from "@/features/onboarding/member-registration/components/MemberRegistrationTable";
import {
  fetchMembers,
  isMemberClientError,
} from "@/features/onboarding/member-registration/services/member-client";
import type {
  Member,
  MemberListResult,
} from "@/features/onboarding/member-registration/types/member.types";

type SpecimenTab = "signatories" | "kyc";

export function SpecimenUpdateView() {
  const t = useTranslations("deposits.specimenUpdate");
  const [tab, setTab] = useState<SpecimenTab>("signatories");
  const [items, setItems] = useState<Member[]>([]);
  const [meta, setMeta] = useState<MemberListResult["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [kycMember, setKycMember] = useState<Member | null>(null);

  const tabs = useMemo(
    () => [
      { id: "signatories" as const, title: t("signatories"), description: t("tabHints.signatories"), icon: PenLine },
      { id: "kyc" as const, title: t("kyc"), description: t("tabHints.kyc"), icon: FileCheck2 },
    ],
    [t],
  );

  useEffect(() => {
    if (tab !== "kyc") return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);
      try {
        const result = await fetchMembers(
          { page, perPage: pageSize },
          { generation: reloadKey, replace: true },
        );
        if (cancelled) return;
        setItems(result.items ?? []);
        setMeta(result.meta ?? null);
      } catch (err) {
        if (cancelled) return;
        setItems([]);
        setMeta(null);
        setError(true);
        setErrorMessage(isMemberClientError(err) ? err.message : t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, reloadKey, t, tab]);

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <SectionTabs
        tabs={tabs}
        activeId={tab}
        onChange={setTab}
        label={t("tabsLabel")}
        layout="inline"
      />

      {tab === "signatories" ? <SpecimenSignatoryPanel /> : (
        <MemberRegistrationTable
          items={items}
          meta={meta}
          page={page}
          pageSize={pageSize}
          loading={loading}
          error={error}
          errorMessage={errorMessage}
          hasFiltersApplied={false}
          title={t("kycTitle")}
          actionMode="kyc"
          onRetry={() => setReloadKey((key) => key + 1)}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onView={() => undefined}
          onEdit={() => undefined}
          onOpenKyc={setKycMember}
          onOpenLocation={() => undefined}
          onRequestStatusChange={() => undefined}
        />
      )}

      <MemberKycModal
        member={kycMember}
        open={kycMember != null}
        onClose={() => setKycMember(null)}
      />
    </div>
  );
}
