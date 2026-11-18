"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  HandCoins,
  LayoutGrid,
  PiggyBank,
  RefreshCw,
  RotateCcw,
  SearchX,
  UserSearch,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionTabs, type SectionTab } from "@/components/shared/SectionTabs";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Member } from "@/features/onboarding/member-registration/types/member.types";
import { usePathname, useRouter } from "@/i18n/navigation";
import { readRecordCode } from "@/lib/navigation/record-code";
import { member360Alerts } from "../member-360.alerts";
import { member360Code } from "../member-360.routes";
import { fetchMember360, isMember360ClientError } from "../services/member-360-client";
import type { Member360 } from "../types/member-360.types";
import { Member360Search } from "./Member360Search";
import {
  Member360ActivityList,
  Member360Deposits,
  Member360Loans,
  Member360Overview,
} from "./Member360Sections";
import { Member360Alerts, Member360Hero, Member360Stats } from "./Member360Summary";

type TabId = "overview" | "deposits" | "loans" | "activity";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: Member360 }
  | { status: "error"; code: number; message: string };

function Member360Skeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-52 w-full" rounded="2xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-24" rounded="2xl" />
        ))}
      </div>
      <Skeleton className="h-16 w-full" rounded="2xl" />
      <Skeleton className="h-80 w-full" rounded="2xl" />
    </div>
  );
}

export function Member360View() {
  const t = useTranslations("onboarding.member360");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const memberCode = readRecordCode(searchParams.get("member") ?? undefined);

  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [tab, setTab] = useState<TabId>("overview");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchKey, setSearchKey] = useState(0);
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!memberCode) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    fetchMember360(memberCode, reloadKey)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          code: isMember360ClientError(reason) ? reason.status : 500,
          message: isMember360ClientError(reason) ? reason.message : t("loadFailed"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [memberCode, reloadKey, t]);

  const reset = useCallback(() => {
    setTab("overview");
    setState({ status: "idle" });
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const selectMember = useCallback(
    (member: Member) => {
      setTab("overview");
      const code = member360Code(member);
      if (code === memberCode) {
        setReloadKey((key) => key + 1);
        return;
      }
      router.replace(`${pathname}?${new URLSearchParams({ member: code })}`, { scroll: false });
    },
    [memberCode, pathname, router],
  );

  const data = state.status === "ready" ? state.data : null;
  const alerts = useMemo(() => (data ? member360Alerts(data) : []), [data]);

  const tabs = useMemo<SectionTab<TabId>[]>(() => {
    const deposits = data?.deposits.length ?? 0;
    const loans = data?.loans.length ?? 0;
    const activity = data?.activity.length ?? 0;
    return [
      { id: "overview", title: t("tabs.overview"), description: t("tabHints.overview"), icon: LayoutGrid },
      { id: "deposits", title: t("tabs.deposits", { count: deposits }), description: t("tabHints.deposits"), icon: PiggyBank },
      { id: "loans", title: t("tabs.loans", { count: loans }), description: t("tabHints.loans"), icon: HandCoins },
      { id: "activity", title: t("tabs.activity", { count: activity }), description: t("tabHints.activity"), icon: Activity },
    ];
  }, [data, t]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          data ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => setReloadKey((key) => key + 1)}
            >
              {t("refresh")}
            </Button>
          ) : null
        }
      />

      <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-start sm:p-5">
        <div className="min-w-0 flex-1">
          <Member360Search key={searchKey} onSelect={selectMember} />
        </div>
        <Button
          type="button"
          variant="secondary"
          icon={RotateCcw}
          className="h-12 shrink-0 rounded-2xl"
          disabled={!memberCode && state.status === "idle"}
          onClick={() => {
            setSearchKey((key) => key + 1);
            reset();
          }}
        >
          {tCommon("reset")}
        </Button>
      </section>

      {state.status === "idle" ? (
        <section className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface">
          <EmptyState
            icon={<UserSearch className="h-5 w-5" aria-hidden />}
            title={t("idle.title")}
            message={t("idle.message")}
          />
        </section>
      ) : state.status === "loading" ? (
        <Member360Skeleton />
      ) : state.status === "error" ? (
        state.code === 404 ? (
          <section className="rounded-[var(--radius-card)] border border-border bg-surface">
            <EmptyState
              icon={<SearchX className="h-5 w-5" aria-hidden />}
              title={t("notFound.title")}
              message={t("notFound.message", { code: memberCode ?? "" })}
            />
          </section>
        ) : (
          <ErrorState
            title={state.code === 403 ? t("forbidden.title") : undefined}
            message={state.code === 403 ? t("forbidden.message") : state.message}
            onRetry={state.code === 403 ? undefined : () => setReloadKey((key) => key + 1)}
          />
        )
      ) : (
        <>
          <Member360Hero data={state.data} />
          <Member360Stats data={state.data} />
          <section aria-label={t("alerts.label")} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-foreground">{t("alerts.label")}</h2>
            <Member360Alerts alerts={alerts} />
          </section>
          <SectionTabs tabs={tabs} activeId={tab} onChange={setTab} label={t("tabs.label")} />
          <div role="tabpanel" aria-label={tabs.find((item) => item.id === tab)?.title}>
            {tab === "overview" ? (
              <Member360Overview data={state.data} />
            ) : tab === "deposits" ? (
              <Member360Deposits data={state.data} />
            ) : tab === "loans" ? (
              <Member360Loans data={state.data} />
            ) : (
              <Member360ActivityList data={state.data} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
