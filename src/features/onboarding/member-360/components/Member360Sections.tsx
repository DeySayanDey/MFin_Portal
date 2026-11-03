"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Coins, IdCard, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { SAVINGS_DEPOSIT_TYPE } from "@/features/deposits/savings/deposit-account.constants";
import { Fact, Panel } from "@/features/deposits/fd-settlement/components/SettlementPanels";
import { Link } from "@/i18n/navigation";
import { depositLinks, memberLinks } from "../member-360.routes";
import type {
  Member360,
  Member360Activity,
  Member360ActivityModule,
  Member360Application,
  Member360Deposit,
  Member360KycStatus,
  Member360Loan,
} from "../types/member-360.types";
import { useMember360Format } from "./useMember360Format";

function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium whitespace-nowrap text-brand transition-colors hover:border-brand/40 hover:bg-brand-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {children}
      <ArrowUpRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}

function PanelLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {label}
      <ArrowUpRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}

const kycTone: Record<Member360KycStatus, BadgeTone> = { 0: "warning", 1: "success", 2: "danger" };

export function Member360Overview({ data }: { data: Member360 }) {
  const { t, text, date, money, count } = useMember360Format();
  const { profile, kyc, groups, nominees, shares } = data;
  const links = memberLinks(profile);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title={t("overview.personal")} icon={UserRound} trailing={<PanelLink href={links.registration} label={t("open")} />}>
        <Fact label={t("overview.father")} value={text(profile.fatherName)} />
        <Fact label={t("overview.spouse")} value={text(profile.spouseName)} />
        <Fact label={t("overview.gender")} value={text(profile.genderDesc)} />
        <Fact
          label={t("overview.dob")}
          value={
            profile.age == null
              ? date(profile.dateOfBirth)
              : t("overview.dobWithAge", { date: date(profile.dateOfBirth), age: profile.age })
          }
        />
        <Fact label={t("overview.altMobile")} value={text(profile.alternateMobileNo)} />
        <Fact label={t("overview.email")} value={text(profile.emailId)} />
        <Fact label={t("overview.pan")} value={text(profile.panMasked)} />
        <Fact label={t("overview.occupation")} value={text(profile.occupation)} />
        <Fact label={t("overview.income")} value={money(profile.monthlyIncome)} />
        <Fact label={t("overview.fieldOfficer")} value={text(profile.foName)} />
        <Fact label={t("overview.address")} value={text(profile.address)} />
      </Panel>

      <div className="flex flex-col gap-4">
        <Panel title={t("overview.kyc")} icon={ShieldCheck} trailing={<PanelLink href={links.kyc} label={t("open")} />}>
          {kyc.length === 0 ? (
            <p className="text-sm text-muted">{t("overview.noKyc")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {kyc.map((doc) => (
                <li key={doc.kycId} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{text(doc.docTypeDesc)}</span>
                    <span className="block text-xs text-muted">
                      {doc.expiryDate
                        ? t("overview.kycNoExpiry", { number: text(doc.kycNoMasked), date: date(doc.expiryDate) })
                        : text(doc.kycNoMasked)}
                    </span>
                  </span>
                  <span className="flex gap-1.5">
                    {doc.isExpired ? (
                      <Badge tone="danger" caps={false}>
                        {t("kycStatus.expired")}
                      </Badge>
                    ) : null}
                    <Badge tone={kycTone[doc.verifyStatus]} caps={false}>
                      {t(`kycStatus.${doc.verifyStatus}`)}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("overview.groups")} icon={UsersRound} trailing={<PanelLink href={links.groups} label={t("open")} />}>
          {groups.length === 0 ? (
            <p className="text-sm text-muted">{t("overview.noGroups")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {groups.map((group) => (
                <li key={`${group.groupId}-${group.joinDate}`} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {t("overview.groupName", { name: text(group.groupName), code: text(group.groupCode) })}
                    </span>
                    <span className="block text-xs text-muted">
                      {t("overview.groupMeta", { role: text(group.memberRole), date: date(group.joinDate) })}
                    </span>
                  </span>
                  <Badge tone={group.isActive ? "success" : "neutral"} caps={false}>
                    {group.isActive ? t("active") : t("overview.exited", { date: date(group.exitDate) })}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("overview.nominees")} icon={IdCard}>
          {nominees.length === 0 ? (
            <p className="text-sm text-muted">{t("overview.noNominees")}</p>
          ) : (
            nominees.map((nominee, index) => (
              <Fact
                key={`${nominee.name}-${index}`}
                label={text(nominee.name)}
                value={
                  nominee.sharePercent == null
                    ? text(nominee.relationDesc)
                    : t("overview.nomineeShare", { relation: text(nominee.relationDesc), percent: nominee.sharePercent })
                }
              />
            ))
          )}
        </Panel>

        <Panel title={t("overview.shares")} icon={Coins} trailing={<PanelLink href={links.shares} label={t("open")} />}>
          <Fact label={t("overview.totalShares")} value={count(shares.totalShares)} />
          <Fact label={t("overview.faceValue")} value={money(shares.faceValue)} />
          <Fact label={t("overview.shareAmount")} value={money(shares.totalAmount)} />
          <Fact label={t("overview.paidAmount")} value={money(shares.paidAmount)} />
          <Fact label={t("overview.pendingShares")} value={count(shares.pendingShares)} />
          <Fact label={t("overview.lastSubscription")} value={date(shares.lastSubscriptionDate)} />
        </Panel>
      </div>
    </div>
  );
}

function statusTone(isClosed: boolean, isNpa = false): BadgeTone {
  if (isNpa) return "danger";
  return isClosed ? "neutral" : "success";
}

export function Member360Deposits({ data }: { data: Member360 }) {
  const { t, text, date, money } = useMember360Format();

  const columns: DataTableColumn<Member360Deposit>[] = [
    {
      id: "account",
      header: t("deposits.account"),
      cell: (row) => (
        <span className="block">
          <span className="block font-medium text-foreground">{text(row.fullAccountNo || row.applNo)}</span>
          <span className="block text-xs text-muted">{text(row.schemeName)}</span>
        </span>
      ),
    },
    {
      id: "type",
      header: t("deposits.type"),
      cell: (row) => (
        <Badge tone={row.depositTypeCd === SAVINGS_DEPOSIT_TYPE ? "info" : "violet"} caps={false}>
          {row.depositTypeCd === SAVINGS_DEPOSIT_TYPE ? t("deposits.savings") : t("deposits.term")}
        </Badge>
      ),
    },
    { id: "role", header: t("role.label"), cell: (row) => t(`role.${row.holderRole}`) },
    { id: "opened", header: t("deposits.opened"), cell: (row) => date(row.openDate) },
    { id: "balance", header: t("deposits.balance"), align: "end", cell: (row) => money(row.balance) },
    {
      id: "maturity",
      header: t("deposits.maturity"),
      cell: (row) =>
        row.maturityDate ? (
          <span className="block">
            <span className="block">{date(row.maturityDate)}</span>
            <span className="block text-xs text-muted">{money(row.maturityAmount)}</span>
          </span>
        ) : (
          t("dash")
        ),
    },
    {
      id: "status",
      header: t("status"),
      cell: (row) => (
        <Badge tone={statusTone(row.isClosed)} caps={false}>
          {text(row.statusDesc)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: (row) => (
        <span className="flex flex-wrap gap-1.5">
          {depositLinks(row).map((link) => (
            <RowLink key={link.key} href={link.href}>
              {t(`deposits.links.${link.key}`)}
            </RowLink>
          ))}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      title={t("deposits.title")}
      description={t("deposits.description")}
      data={data.deposits}
      columns={columns}
      getRowKey={(row) => String(row.accountId)}
      emptyTitle={t("deposits.emptyTitle")}
      emptyMessage={t("deposits.emptyMessage")}
      minWidth="960px"
    />
  );
}

export function Member360Loans({ data }: { data: Member360 }) {
  const { t, text, date, money } = useMember360Format();
  const links = memberLinks(data.profile);

  const loanColumns: DataTableColumn<Member360Loan>[] = [
    {
      id: "account",
      header: t("loans.account"),
      cell: (row) => (
        <span className="block">
          <span className="block font-medium text-foreground">{text(row.loanAccountNo)}</span>
          <span className="block text-xs text-muted">{text(row.schemeName)}</span>
        </span>
      ),
    },
    {
      id: "role",
      header: t("role.label"),
      cell: (row) => (
        <span className="block">
          <span className="block">{t(`role.${row.borrowerRole}`)}</span>
          {row.groupName ? <span className="block text-xs text-muted">{row.groupName}</span> : null}
        </span>
      ),
    },
    { id: "date", header: t("loans.loanDate"), cell: (row) => date(row.loanDate) },
    { id: "amount", header: t("loans.amount"), align: "end", cell: (row) => money(row.loanAmount) },
    { id: "outstanding", header: t("loans.outstanding"), align: "end", cell: (row) => money(row.outstanding) },
    {
      id: "overdue",
      header: t("loans.overdue"),
      align: "end",
      cell: (row) =>
        row.overdueAmount > 0 ? (
          <span className="block text-rose-700">
            <span className="block font-medium">{money(row.overdueAmount)}</span>
            <span className="block text-xs">{t("loans.overdueDays", { count: row.overdueDays })}</span>
          </span>
        ) : (
          t("dash")
        ),
    },
    {
      id: "nextDue",
      header: t("loans.nextDue"),
      cell: (row) =>
        row.nextDueDate ? (
          <span className="block">
            <span className="block">{date(row.nextDueDate)}</span>
            <span className="block text-xs text-muted">{money(row.nextDueAmount)}</span>
          </span>
        ) : (
          t("dash")
        ),
    },
    {
      id: "status",
      header: t("status"),
      cell: (row) => (
        <span className="flex flex-wrap gap-1.5">
          <Badge tone={statusTone(row.isClosed)} caps={false}>
            {text(row.statusDesc)}
          </Badge>
          {row.isNpa ? (
            <Badge tone="danger" caps={false}>
              {t("loans.npa")}
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("actions"),
      cell: (row) => (
        <span className="flex flex-wrap gap-1.5">
          {!row.isClosed ? <RowLink href={links.collections}>{t("loans.links.collect")}</RowLink> : null}
          <RowLink href={links.disbursement}>{t("loans.links.disbursement")}</RowLink>
        </span>
      ),
    },
  ];

  const applicationColumns: DataTableColumn<Member360Application>[] = [
    { id: "number", header: t("applications.number"), cell: (row) => text(row.applicationNo) },
    { id: "date", header: t("applications.date"), cell: (row) => date(row.applicationDate) },
    { id: "scheme", header: t("applications.scheme"), cell: (row) => text(row.schemeName) },
    { id: "amount", header: t("applications.amount"), align: "end", cell: (row) => money(row.amount) },
    {
      id: "status",
      header: t("status"),
      cell: (row) => (
        <Badge tone="info" caps={false}>
          {text(row.statusDesc)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        title={t("loans.title")}
        description={t("loans.description")}
        data={data.loans}
        columns={loanColumns}
        getRowKey={(row) => String(row.loanAccountId)}
        emptyTitle={t("loans.emptyTitle")}
        emptyMessage={t("loans.emptyMessage")}
        minWidth="1080px"
      />
      <DataTable
        title={t("applications.title")}
        description={t("applications.description")}
        actions={<RowLink href={links.loanApplications}>{t("applications.openList")}</RowLink>}
        data={data.applications}
        columns={applicationColumns}
        getRowKey={(row) => String(row.applicationId)}
        emptyTitle={t("applications.emptyTitle")}
        emptyMessage={t("applications.emptyMessage")}
        minWidth="720px"
      />
    </div>
  );
}

const moduleTone: Record<Member360ActivityModule, BadgeTone> = {
  savings: "info",
  term: "violet",
  loan: "success",
  share: "amber",
};

export function Member360ActivityList({ data }: { data: Member360 }) {
  const { t, text, date, money } = useMember360Format();

  const columns: DataTableColumn<Member360Activity>[] = [
    { id: "date", header: t("activity.date"), cell: (row) => date(row.date) },
    {
      id: "module",
      header: t("activity.module"),
      cell: (row) => (
        <Badge tone={moduleTone[row.module]} caps={false}>
          {t(`activity.modules.${row.module}`)}
        </Badge>
      ),
    },
    { id: "reference", header: t("activity.reference"), cell: (row) => text(row.reference) },
    { id: "description", header: t("activity.details"), cell: (row) => text(row.description) },
    {
      id: "credit",
      header: t("activity.credit"),
      align: "end",
      cell: (row) => (row.credit > 0 ? <span className="text-emerald-700">{money(row.credit)}</span> : t("dash")),
    },
    {
      id: "debit",
      header: t("activity.debit"),
      align: "end",
      cell: (row) => (row.debit > 0 ? <span className="text-rose-700">{money(row.debit)}</span> : t("dash")),
    },
  ];

  return (
    <DataTable
      title={t("activity.title")}
      description={t("activity.description")}
      data={data.activity}
      columns={columns}
      getRowKey={(row) => row.key}
      emptyTitle={t("activity.emptyTitle")}
      emptyMessage={t("activity.emptyMessage")}
      minWidth="820px"
    />
  );
}
