"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Banknote, Landmark } from "lucide-react";
import { DataPage } from "@/components/shared/DataPage";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { PageToast, useToastText } from "@/components/ui/PageToast";
import { fetchAcctLedgerList } from "@/features/master/acct-ledger";
import { fetchAcctCategoryList } from "@/features/master/acct-category/services/acct-category-client";
import { fetchApplOptions } from "@/features/master/appl-options";
import type { ApplOption } from "@/features/master/appl-options";
import type { AcctLedger } from "@/features/master/acct-ledger/types/acct-ledger.types";
import { masterModulePages } from "@/lib/modules/module.types";
import { ChargesSetupSection } from "./ChargesSetupSection";
import {
  CHARGE_FIGURE_OPT_GRP_ID,
  DEPOSIT_CHARGES_DURING_OPT_GRP_ID,
  LOAN_CHARGES_DURING_OPT_GRP_ID,
} from "../constants";

type PanelId = "deposit" | "loan";

const TAB_IDS: PanelId[] = ["deposit", "loan"];

function normalizeTab(value: string | null | undefined): PanelId | null {
  if (!value) return null;
  if (TAB_IDS.includes(value as PanelId)) return value as PanelId;
  return null;
}

export function ChargesSetupView({
  initialTab,
}: {
  initialTab?: string;
}) {
  const t = useTranslations("master.chargesSetup");
  const pageMeta = useMemo(() => masterModulePages.chargesSetup.toJSON(), []);
  const [optionsError, setOptionsError] = useToastText();

  const [activeTab, setActiveTab] = useState<PanelId>(
    () => normalizeTab(initialTab) ?? "deposit",
  );

  const [figureOptions, setFigureOptions] = useState<ApplOption[]>([]);
  const [depositDuringOptions, setDepositDuringOptions] = useState<
    ApplOption[]
  >([]);
  const [loanDuringOptions, setLoanDuringOptions] = useState<ApplOption[]>([]);
  const [ledgers, setLedgers] = useState<AcctLedger[]>([]);
  const [depositLedgers, setDepositLedgers] = useState<AcctLedger[]>([]);

  const tabs = useMemo(
    () => [
      { id: "deposit" as const, title: t("tabs.deposit"), description: t("tabHints.deposit"), icon: Banknote },
      { id: "loan" as const, title: t("tabs.loan"), description: t("tabHints.loan"), icon: Landmark },
    ],
    [t],
  );

  useEffect(() => {
    function onPopState() {
      const next = normalizeTab(
        new URLSearchParams(window.location.search).get("tab"),
      );
      if (next) setActiveTab(next);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const [figure, depositDuring, loanDuring, ledgerResult, categoryResult] =
        await Promise.allSettled([
          fetchApplOptions(CHARGE_FIGURE_OPT_GRP_ID),
          fetchApplOptions(DEPOSIT_CHARGES_DURING_OPT_GRP_ID),
          fetchApplOptions(LOAN_CHARGES_DURING_OPT_GRP_ID),
          loadActiveLedgers(),
          loadCreditCategoryIds(),
        ]);

      if (cancelled) return;

      if (figure.status === "fulfilled") setFigureOptions(figure.value);
      if (depositDuring.status === "fulfilled") {
        setDepositDuringOptions(depositDuring.value);
      }
      if (loanDuring.status === "fulfilled") {
        setLoanDuringOptions(loanDuring.value);
      }
      if (ledgerResult.status === "fulfilled") {
        setLedgers(ledgerResult.value);
      }
      if (ledgerResult.status === "fulfilled" && categoryResult.status === "fulfilled") {
        const creditIds = new Set(categoryResult.value);
        setDepositLedgers(ledgerResult.value.filter((ledger) => ledger.categId != null && creditIds.has(ledger.categId)));
      } else {
        setDepositLedgers([]);
      }

      const failed = [figure, depositDuring, loanDuring, ledgerResult, categoryResult].some(
        (result) => result.status === "rejected",
      );
      if (failed) {
        setOptionsError(t("optionsError"));
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [setOptionsError, t]);

  function handleSelectTab(id: PanelId) {
    setActiveTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url.toString());
  }

  return (
    <DataPage page={pageMeta}>
      <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <PageToast message={optionsError} tone="error" />
        <SectionTabs
          tabs={tabs}
          activeId={activeTab}
          onChange={handleSelectTab}
          label={t("title")}
        />

        {activeTab === "deposit" ? (
          <ChargesSetupSection
            kind="deposit"
            figureOptions={figureOptions}
            duringOptions={depositDuringOptions}
            ledgers={depositLedgers}
          />
        ) : (
          <ChargesSetupSection
            kind="loan"
            figureOptions={figureOptions}
            duringOptions={loanDuringOptions}
            ledgers={ledgers}
          />
        )}
      </div>
    </DataPage>
  );
}

async function loadActiveLedgers(): Promise<AcctLedger[]> {
  const items: AcctLedger[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await fetchAcctLedgerList({ isActive: 1, page, perPage: 200 });
    items.push(...result.items);
    if (!result.meta && result.items.length === 200) throw new Error("Ledger pagination missing");
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage);
  return items;
}

async function loadCreditCategoryIds(): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await fetchAcctCategoryList({ categoryType: "CR", page, perPage: 200 });
    ids.push(...result.items.filter((item) => item.categoryType?.trim().toUpperCase() === "CR").map((item) => item.categId));
    if (!result.meta && result.items.length === 200) throw new Error("Category pagination missing");
    lastPage = result.meta?.lastPage ?? 1;
    page += 1;
  } while (page <= lastPage);
  return ids;
}
