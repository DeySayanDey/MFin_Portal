"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  Coins,
  FileText,
  HandCoins,
  Info,
  Landmark,
  PiggyBank,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UserX,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import {
  SAVINGS_DEPOSIT_TYPE,
  TERM_DEPOSIT_TYPE,
} from "@/features/deposits/savings/deposit-account.constants";
import { Link } from "@/i18n/navigation";
import { ACTIVE_MEMBER_STATUS, type Member360Alert } from "../member-360.alerts";
import { memberLinks } from "../member-360.routes";
import type { Member360 } from "../types/member-360.types";
import { useMember360Format } from "./useMember360Format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type QuickLinkKey = keyof ReturnType<typeof memberLinks>;

const QUICK_LINKS: { key: QuickLinkKey; icon: LucideIcon }[] = [
  { key: "registration", icon: UserRound },
  { key: "kyc", icon: ShieldCheck },
  { key: "groups", icon: UsersRound },
  { key: "shares", icon: Coins },
  { key: "ledger", icon: BookOpen },
  { key: "openSavings", icon: PiggyBank },
  { key: "openTerm", icon: Landmark },
  { key: "loanApplications", icon: FileText },
  { key: "disbursement", icon: HandCoins },
  { key: "collections", icon: Wallet },
  { key: "closure", icon: UserX },
];

function kycTone(data: Member360): { tone: BadgeTone; key: "verified" | "pending" | "rejected" | "missing" } {
  if (data.kyc.length === 0) return { tone: "warning", key: "missing" };
  if (data.kyc.some((doc) => doc.verifyStatus === 2)) return { tone: "danger", key: "rejected" };
  if (data.kyc.some((doc) => doc.verifyStatus === 0 || doc.isExpired)) return { tone: "warning", key: "pending" };
  return { tone: "success", key: "verified" };
}

export function Member360Hero({ data }: { data: Member360 }) {
  const { t, text, date } = useMember360Format();
  const { profile } = data;
  const links = memberLinks(profile);
  const kyc = kycTone(data);

  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 bg-gradient-to-br from-brand-soft/70 via-surface to-surface p-4 sm:flex-row sm:items-center sm:p-5">
        <span
          className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-semibold text-white shadow-[0_8px_20px_-10px_var(--color-brand)]"
          aria-hidden
        >
          {initials(profile.memberName) || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-foreground sm:text-xl">{profile.memberName}</h2>
            <Badge tone={profile.statusCd === ACTIVE_MEMBER_STATUS ? "success" : "danger"} caps={false}>
              {text(profile.statusDesc)}
            </Badge>
            <Badge tone={kyc.tone} caps={false}>
              {t(`kycBadge.${kyc.key}`)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {t("hero.codes", { code: text(profile.memberCode), ref: text(profile.refCode) })}
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["mobile", text(profile.mobileNo)],
                ["branch", text(profile.branchName)],
                ["center", text(profile.centerName)],
                ["joined", date(profile.joiningDate)],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="text-xs text-muted">{t(`hero.${key}`)}</dt>
                <dd className="truncate font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <nav aria-label={t("links.label")} className="border-t border-border p-4 sm:px-5">
        <p className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">{t("links.label")}</p>
        <ul className="flex flex-wrap gap-2">
          {QUICK_LINKS.map(({ key, icon: Icon }) => (
            <li key={key}>
              <Link
                href={links[key]}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-brand-soft/50 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {t(`links.${key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

type StatTone = "brand" | "emerald" | "amber" | "rose" | "violet";

const statToneClass: Record<StatTone, string> = {
  brand: "bg-brand-soft text-brand",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
};

function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  tone: StatTone;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statToneClass[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className="block truncate text-lg font-semibold text-foreground">{value}</span>
        <span className="block truncate text-xs text-muted">{hint}</span>
      </span>
    </div>
  );
}

export function Member360Stats({ data }: { data: Member360 }) {
  const { t, money } = useMember360Format();
  const { totals, shares } = data;
  const openOf = (type: number) =>
    data.deposits.filter((deposit) => !deposit.isClosed && deposit.depositTypeCd === type).length;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatTile
        icon={PiggyBank}
        tone="brand"
        label={t("stats.savings")}
        value={money(totals.savingsBalance)}
        hint={t("stats.openAccounts", { count: openOf(SAVINGS_DEPOSIT_TYPE) })}
      />
      <StatTile
        icon={Landmark}
        tone="violet"
        label={t("stats.term")}
        value={money(totals.termBalance)}
        hint={t("stats.openAccounts", { count: openOf(TERM_DEPOSIT_TYPE) })}
      />
      <StatTile
        icon={HandCoins}
        tone="emerald"
        label={t("stats.outstanding")}
        value={money(totals.loanOutstanding)}
        hint={t("stats.activeLoans", { count: totals.activeLoans })}
      />
      <StatTile
        icon={AlertTriangle}
        tone={totals.loanOverdue > 0 ? "rose" : "emerald"}
        label={t("stats.overdue")}
        value={money(totals.loanOverdue)}
        hint={totals.loanOverdue > 0 ? t("stats.overdueHint") : t("stats.noOverdue")}
      />
      <StatTile
        icon={Coins}
        tone="amber"
        label={t("stats.shares")}
        value={money(shares.totalAmount)}
        hint={t("stats.shareCount", { count: shares.totalShares })}
      />
    </div>
  );
}

const alertStyle: Record<Member360Alert["tone"], { className: string; icon: LucideIcon }> = {
  danger: { className: "border-rose-200 bg-rose-50 text-rose-800", icon: ShieldAlert },
  warning: { className: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle },
  info: { className: "border-blue-200 bg-blue-50 text-blue-800", icon: CalendarClock },
};

export function Member360Alerts({ alerts }: { alerts: Member360Alert[] }) {
  const { t, money } = useMember360Format();
  if (alerts.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <Info className="h-4 w-4 shrink-0" aria-hidden />
        {t("alerts.none")}
      </p>
    );
  }

  function message(alert: Member360Alert): string {
    switch (alert.key) {
      case "inactive":
        return t("alerts.inactive", { status: alert.status || t("dash") });
      case "kycMissing":
        return t("alerts.kycMissing");
      case "overdue":
        return t("alerts.overdue", { count: alert.count, amount: money(alert.amount) });
      case "maturing":
        return t("alerts.maturing", { count: alert.count, days: alert.days });
      default:
        return t(`alerts.${alert.key}`, { count: alert.count });
    }
  }

  return (
    <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2" aria-label={t("alerts.label")}>
      {alerts.map((alert) => {
        const style = alertStyle[alert.tone];
        const Icon = style.icon;
        return (
          <li
            key={alert.key}
            className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${style.className}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{message(alert)}</span>
          </li>
        );
      })}
    </ul>
  );
}
