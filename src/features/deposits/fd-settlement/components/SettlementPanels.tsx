"use client";

import { useCallback, type ReactNode } from "react";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Clock,
  Landmark,
  Repeat,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { parseYmd } from "@/features/deposits/savings/deposit-account.rules";
import type { KycState, SettlementAccount, SettlementQuote } from "../types/fd-settlement.types";

const KYC_TONE: Record<KycState, BadgeTone> = {
  verified: "success",
  due: "warning",
  restricted: "danger",
};

export function useSettlementFormat() {
  const t = useTranslations("deposits.fdSettlement");
  const format = useFormatter();

  const money = useCallback(
    (value: number | null, signed = false) =>
      value == null
        ? t("dash")
        : format.number(value, {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            signDisplay: signed ? "exceptZero" : "auto",
          }),
    [format, t],
  );

  const dateLabel = useCallback(
    (value: string) => {
      const parsed = parseYmd(value);
      return parsed
        ? format.dateTime(parsed, { month: "short", day: "numeric", year: "numeric" })
        : t("dash");
    },
    [format, t],
  );

  const rate = useCallback(
    (value: number) => format.number(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [format],
  );

  return { money, dateLabel, rate };
}

export function Panel({
  title,
  icon: Icon,
  trailing,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
          {Icon ? (
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          ) : null}
          {title}
        </h2>
        {trailing}
      </div>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

export function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border p-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className="block break-words text-sm font-semibold text-foreground">{value}</span>
      </span>
    </div>
  );
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-end font-medium break-words text-slate-900">{value}</span>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CustomerPanel({ account }: { account: SettlementAccount }) {
  const t = useTranslations("deposits.fdSettlement");
  return (
    <Panel title={t("workspace.customer")} icon={UserRound}>
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-muted p-3">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
          aria-hidden
        >
          {initials(account.customerName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{account.customerName || t("dash")}</p>
          <p className="flex flex-wrap gap-x-1.5 text-xs text-muted">
            <span>{t("workspace.customerId")}</span>
            <span className="font-medium text-foreground">{account.customerId || t("dash")}</span>
          </p>
        </div>
        <Badge tone={KYC_TONE[account.kyc]} caps={false}>
          {t("workspace.kycStatus", { status: t(`kyc.${account.kyc}`) })}
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoTile icon={Users} label={t("workspace.holding")} value={t(`holding.${account.holding}`)} />
        <InfoTile icon={Building2} label={t("workspace.branch")} value={account.branchName || t("dash")} />
      </div>
    </Panel>
  );
}

export function DepositPanel({ account }: { account: SettlementAccount }) {
  const t = useTranslations("deposits.fdSettlement");
  const { money, dateLabel, rate } = useSettlementFormat();
  return (
    <Panel
      title={t("workspace.deposit")}
      icon={Landmark}
      trailing={
        <Badge tone="info" caps={false}>
          {account.schemeName || t(`schemes.${account.scheme}`)}
        </Badge>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-brand/20 bg-brand-soft p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted">{t("workspace.principal")}</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{money(account.principal)}</p>
        </div>
        <div className="min-w-0 text-end">
          <p className="text-xs text-muted">{t("workspace.rate")}</p>
          <p className="text-base font-semibold tabular-nums text-brand-ink">
            {t("workspace.rateValue", { rate: rate(account.ratePercent) })}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoTile icon={CalendarDays} label={t("workspace.open")} value={dateLabel(account.openDate)} />
        <InfoTile icon={CalendarCheck} label={t("workspace.maturity")} value={dateLabel(account.maturityDate)} />
        <InfoTile icon={Clock} label={t("workspace.tenure")} value={t("workspace.tenureValue", { count: account.tenureMonths })} />
        <InfoTile icon={Repeat} label={t("workspace.payoutFrequency")} value={t(`workspace.${account.payoutFrequency}`)} />
      </div>
    </Panel>
  );
}

export function MisPanel({ account }: { account: SettlementAccount }) {
  const t = useTranslations("deposits.fdSettlement");
  const { money, dateLabel } = useSettlementFormat();
  if (!account.mis) return null;
  return (
    <Panel title={t("mis.title")}>
      <Fact label={t("mis.monthly")} value={money(account.mis.monthlyInterest)} />
      <Fact label={t("mis.lastPaid")} value={dateLabel(account.mis.lastPaidDate)} />
      <Fact label={t("mis.totalPaid")} value={money(account.mis.totalInterestPaid)} />
      <Fact label={t("mis.unpaid")} value={String(account.mis.unpaidInstallments)} />
      <Fact label={t("mis.pending")} value={money(account.mis.pendingInterest)} />
      <Fact label={t("mis.excess")} value={money(account.mis.recoverableExcess)} />
    </Panel>
  );
}

export function QuoteBreakdown({ quote }: { quote: SettlementQuote }) {
  const t = useTranslations("deposits.fdSettlement");
  const { money, dateLabel } = useSettlementFormat();
  const lines = [
    { key: "principal", amount: quote.principal, signed: false },
    { key: "interest", amount: quote.interest, signed: true },
    { key: "overdue", amount: quote.overdueInterest, signed: true },
    { key: "recovery", amount: -quote.interestRecovery, signed: true },
    { key: "penalty", amount: -quote.penalty, signed: true },
    { key: "tds", amount: -quote.tds, signed: true },
    { key: "other", amount: -quote.otherDeductions, signed: true },
  ].filter((line) => line.key === "principal" || line.amount !== 0);

  return (
    <>
      {lines.map((line) => (
        <Fact key={line.key} label={t(`workspace.lines.${line.key}`)} value={money(line.amount, line.signed)} />
      ))}
      <div className="mt-1 border-t border-border pt-3">
        <Fact label={t("workspace.lines.net")} value={money(quote.netPayable)} />
      </div>
      {quote.quoteId ? (
        <p className="text-xs text-muted">
          {t("workspace.quoteMeta", { id: quote.quoteId, date: dateLabel(quote.expiresOn) })}
        </p>
      ) : null}
    </>
  );
}
