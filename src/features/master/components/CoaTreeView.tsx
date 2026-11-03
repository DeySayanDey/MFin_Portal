"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, GitBranch, GitFork, Layers, Tag } from "lucide-react";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { AcctCategoryView } from "@/features/master/acct-category";
import { AcctHeadView } from "@/features/master/acct-head";
import { AcctLedgerView } from "@/features/master/acct-ledger";
import { AcctSubledgerView } from "@/features/master/acct-subledger";
import { AcctSubledgerBranchView } from "@/features/master/acct-subledger-branch";

export type PanelId =
  | "categories"
  | "heads"
  | "ledgers"
  | "subledgers"
  | "branches";

const TAB_IDS: PanelId[] = [
  "categories",
  "heads",
  "ledgers",
  "subledgers",
  "branches",
];

function normalizeTab(value: string | null | undefined): PanelId | null {
  if (!value) return null;
  if (value === "sub-ledger") return "subledgers";
  if (TAB_IDS.includes(value as PanelId)) return value as PanelId;
  return null;
}

export type CoaTreeViewProps = {
  initialTab?: string;
};

export function CoaTreeView({
  initialTab = "categories",
}: CoaTreeViewProps = {}) {
  const tCategory = useTranslations("master.acctCategory");
  const tHead = useTranslations("master.acctHead");
  const tLedger = useTranslations("master.acctLedger");
  const tSubledger = useTranslations("master.acctSubledger");
  const tBranch = useTranslations("master.acctSubledgerBranch");

  const tabs = useMemo(
    () => [
      { id: "categories" as const, title: tCategory("title"), description: tCategory("description"), icon: Layers },
      { id: "heads" as const, title: tHead("title"), description: tHead("description"), icon: Tag },
      { id: "ledgers" as const, title: tLedger("title"), description: tLedger("description"), icon: BookOpen },
      {
        id: "subledgers" as const,
        title: tSubledger("title"),
        description: tSubledger("description"),
        icon: GitBranch,
      },
      { id: "branches" as const, title: tBranch("title"), description: tBranch("description"), icon: GitFork },
    ],
    [tBranch, tCategory, tHead, tLedger, tSubledger],
  );

  const initialPanel = normalizeTab(initialTab) ?? "categories";
  const [activeTab, setActiveTab] = useState<PanelId>(initialPanel);
  const [mountedTabs, setMountedTabs] = useState<PanelId[]>(() => [initialPanel]);

  function rememberTab(id: PanelId) {
    setMountedTabs((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }

  // Sync from URL only after mount — never during useState (avoids hydration mismatch).
  useEffect(() => {
    const fromUrl = normalizeTab(
      new URLSearchParams(window.location.search).get("tab"),
    );
    if (fromUrl && fromUrl !== activeTab) {
      setActiveTab(fromUrl);
      rememberTab(fromUrl);
    }

    function onPopState() {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      const next = normalizeTab(tabParam);
      if (next) {
        setActiveTab(next);
        rememberTab(next);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // Intentionally run once on mount for URL sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only URL hydration
  }, []);

  function handleSelectTab(id: PanelId) {
    setActiveTab(id);
    rememberTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url.toString());
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <SectionTabs
        tabs={tabs}
        activeId={activeTab}
        onChange={handleSelectTab}
        label={tCategory("title")}
      />

      {mountedTabs.map((id) => (
        <div
          key={id}
          hidden={id !== activeTab}
          className={id === activeTab ? "content-settle" : undefined}
        >
          {id === "categories" ? <AcctCategoryView embedded /> : null}
          {id === "heads" ? <AcctHeadView embedded /> : null}
          {id === "ledgers" ? <AcctLedgerView embedded /> : null}
          {id === "subledgers" ? <AcctSubledgerView embedded /> : null}
          {id === "branches" ? <AcctSubledgerBranchView embedded /> : null}
        </div>
      ))}
    </div>
  );
}

export { CoaTreeView as AccountLedgerSetupView };
