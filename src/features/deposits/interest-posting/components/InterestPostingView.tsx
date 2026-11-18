"use client";

import { useState } from "react";
import { CalendarClock, Layers, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionTabs, type SectionTab } from "@/components/shared/SectionTabs";
import { DateField } from "@/components/ui/Form";
import { todayYmd } from "@/features/deposits/savings/deposit-account.rules";
import type { InterestMode } from "../types/interest-posting.types";
import { BulkInterestPanel } from "./BulkInterestPanel";
import { SingleInterestPanel } from "./SingleInterestPanel";

type InterestPostingViewProps = {
  canPickBranch: boolean;
};

export function InterestPostingView({ canPickBranch }: InterestPostingViewProps) {
  const t = useTranslations("deposits.interestPosting");
  const [tab, setTab] = useState<InterestMode>("single");
  const [today] = useState(() => todayYmd());
  const [asOnDate, setAsOnDate] = useState(today);
  const [postingDate, setPostingDate] = useState(today);

  const tabs: SectionTab<InterestMode>[] = [
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
          <h2 className="text-sm font-semibold text-foreground">{t("period.title")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <DateField
            label={t("period.asOn")}
            value={asOnDate}
            max={today}
            required
            hint={t("period.asOnHint")}
            onChange={(value) => {
              setAsOnDate(value);
              if (value && postingDate < value) setPostingDate(value);
            }}
          />
          <DateField
            label={t("period.postingDate")}
            value={postingDate}
            min={asOnDate}
            max={today}
            required
            hint={t("period.postingHint")}
            onChange={setPostingDate}
          />
        </div>
      </section>

      <SectionTabs tabs={tabs} activeId={tab} onChange={setTab} label={t("tabs.label")} />

      <div role="tabpanel" aria-label={tabs.find((item) => item.id === tab)?.title}>
        {tab === "single" ? (
          <SingleInterestPanel asOnDate={asOnDate} postingDate={postingDate || asOnDate} />
        ) : (
          <BulkInterestPanel asOnDate={asOnDate} postingDate={postingDate || asOnDate} canPickBranch={canPickBranch} />
        )}
      </div>
    </div>
  );
}
