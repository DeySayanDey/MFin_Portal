"use client";

import { useState } from "react";
import { CalendarClock, Layers, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionTabs, type SectionTab } from "@/components/shared/SectionTabs";
import { DateField } from "@/components/ui/Form";
import { todayYmd } from "@/features/deposits/savings/deposit-account.rules";
import type { ChargeMode } from "../types/charge-posting.types";
import { BulkChargePanel } from "./BulkChargePanel";
import { SingleChargePanel } from "./SingleChargePanel";

type ChargePostingViewProps = {
  canPickBranch: boolean;
};

export function ChargePostingView({ canPickBranch }: ChargePostingViewProps) {
  const t = useTranslations("deposits.chargePosting");
  const [tab, setTab] = useState<ChargeMode>("single");
  const [today] = useState(() => todayYmd());
  const [chargeDate, setChargeDate] = useState(today);

  const tabs: SectionTab<ChargeMode>[] = [
    { id: "single", title: t("tabs.single"), description: t("tabHints.single"), icon: Wallet },
    { id: "bulk", title: t("tabs.bulk"), description: t("tabHints.bulk"), icon: Layers },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader title={t("title")} description={t("description")} />

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <CalendarClock className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold text-foreground">{t("date.title")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <DateField
            label={t("date.chargeDate")}
            value={chargeDate}
            max={today}
            required
            hint={t("date.chargeDateHint")}
            onChange={setChargeDate}
          />
        </div>
      </section>

      <SectionTabs tabs={tabs} activeId={tab} onChange={setTab} label={t("tabs.label")} />

      <div role="tabpanel" aria-label={tabs.find((item) => item.id === tab)?.title}>
        {tab === "single" ? (
          <SingleChargePanel chargeDate={chargeDate} />
        ) : (
          <BulkChargePanel chargeDate={chargeDate} canPickBranch={canPickBranch} />
        )}
      </div>
    </div>
  );
}
