"use client";

import { useMemo, useState } from "react";
import { LayoutList, PenLine, RefreshCw, UserRound, Users, UsersRound } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { DataTable } from "@/components/shared/DataTable";
import type { DataTableColumn } from "@/components/shared/DataTable";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import {
  STATUS_PENDING,
  STATUS_POSTED,
  STATUS_REJECTED,
} from "@/features/deposits/savings-transaction/savings-transaction.constants";
import { CUST_TYPE_GROUP } from "../deposit-account.constants";
import {
  depositAccountHref,
  depositStatusTone,
  parseYmd,
  savingsTransactionHref,
} from "../deposit-account.rules";
import type {
  DepositAccountDetail,
  DepositAccountMember,
  DepositAccountTransaction,
  DepositNominee,
  DepositSignatory,
} from "../types/deposit-account.types";

type PanelId = "overview" | "members" | "nominees" | "signatories" | "transactions";

type DepositAccountDetailTabsProps = {
  account: DepositAccountDetail;
  syncing: boolean;
  onSyncMembers: () => void;
};

function transactionTone(statusCd: number): BadgeTone {
  if (statusCd === STATUS_POSTED) return "success";
  if (statusCd === STATUS_PENDING) return "warning";
  if (statusCd === STATUS_REJECTED) return "danger";
  return "neutral";
}

export function DepositAccountDetailTabs({
  account,
  syncing,
  onSyncMembers,
}: DepositAccountDetailTabsProps) {
  const t = useTranslations("deposits.savings");
  const format = useFormatter();
  const [tab, setTab] = useState<PanelId>("overview");
  const isGroup = account.custTypeCd === CUST_TYPE_GROUP;

  const dash = t("dash");
  const money = (value: number | null) =>
    value == null
      ? dash
      : format.number(value, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  const date = (value: string | null) => {
    const parsed = value ? parseYmd(value) : null;
    return parsed
      ? format.dateTime(parsed, { day: "2-digit", month: "2-digit", year: "numeric" })
      : dash;
  };
  const join = (...parts: (string | null | undefined)[]) =>
    parts.filter(Boolean).join(" · ") || dash;

  const tabs = useMemo(
    () => [
      {
        id: "overview" as const,
        title: t("view.overview"),
        description: t("view.tabHints.overview"),
        icon: LayoutList,
      },
      ...(isGroup
        ? [
            {
              id: "members" as const,
              title: t("view.members", { count: account.members.length }),
              description: t("view.tabHints.members"),
              icon: UsersRound,
            },
          ]
        : []),
      {
        id: "nominees" as const,
        title: t("view.nominees", { count: account.nominees.length }),
        description: t("view.tabHints.nominees"),
        icon: UserRound,
      },
      {
        id: "signatories" as const,
        title: t("view.signatories", { count: account.signatories.length }),
        description: t("view.tabHints.signatories"),
        icon: Users,
      },
      {
        id: "transactions" as const,
        title: t("view.transactions", { count: account.transactionCount }),
        description: t("view.tabHints.transactions"),
        icon: PenLine,
      },
    ],
    [
      account.members.length,
      account.nominees.length,
      account.signatories.length,
      account.transactionCount,
      isGroup,
      t,
    ],
  );

  const memberColumns: DataTableColumn<DepositAccountMember>[] = [
    {
      id: "member",
      header: t("view.memberColumns.member"),
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.memberName || dash}</p>
          <p className="text-xs text-muted">{join(row.memberRefCode, row.mobileNo)}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: t("view.memberColumns.role"),
      cell: (row) => (
        <div>
          <p className="text-slate-800">{row.memberRole || dash}</p>
          {row.isCurrentMember ? null : (
            <p className="text-xs text-muted">{t("view.memberLeft")}</p>
          )}
        </div>
      ),
    },
    {
      id: "openDate",
      header: t("view.memberColumns.openDate"),
      cell: (row) => date(row.openDate),
    },
    {
      id: "balance",
      header: t("view.memberColumns.balance"),
      align: "end",
      className: "tabular-nums",
      cell: (row) => money(row.currentBalance),
    },
    {
      id: "status",
      header: t("view.memberColumns.status"),
      cell: (row) =>
        row.acStatusCd == null ? (
          dash
        ) : (
          <Badge tone={depositStatusTone(row.acStatusCd)} caps={false}>
            {row.acStatusDesc || dash}
          </Badge>
        ),
    },
  ];

  const nomineeColumns: DataTableColumn<DepositNominee>[] = [
    {
      id: "name",
      header: t("view.nomineeColumns.name"),
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.nomName || dash}</p>
          <p className="text-xs text-muted">{join(row.nomCustRefCode, row.contactNo)}</p>
        </div>
      ),
    },
    {
      id: "relation",
      header: t("view.nomineeColumns.relation"),
      cell: (row) => row.relationDesc || dash,
    },
    {
      id: "age",
      header: t("view.nomineeColumns.age"),
      cell: (row) =>
        row.age == null ? dash : t("form.nominees.ageValue", { age: row.age }),
    },
    {
      id: "share",
      header: t("view.nomineeColumns.share"),
      align: "end",
      cell: (row) =>
        row.sharePercent == null
          ? dash
          : t("form.nominees.shareValue", {
              percent: format.number(row.sharePercent, { maximumFractionDigits: 2 }),
            }),
    },
  ];

  const signatoryColumns: DataTableColumn<DepositSignatory>[] = [
    {
      id: "name",
      header: t("view.signatoryColumns.name"),
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.custName || dash}</p>
          <p className="text-xs text-muted">{join(row.custRefCode, row.custMobile)}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: t("view.signatoryColumns.role"),
      cell: (row) => row.signatoryRole || dash,
    },
  ];

  const transactionColumns: DataTableColumn<DepositAccountTransaction>[] = [
    {
      id: "transNo",
      header: t("view.transactionColumns.transNo"),
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.transNo || dash}</p>
          <p className="text-xs text-muted">{date(row.transDate)}</p>
        </div>
      ),
    },
    {
      id: "type",
      header: t("view.transactionColumns.type"),
      cell: (row) => (
        <div>
          <p className="text-slate-800">{row.transTypeDesc || dash}</p>
          <p className="text-xs text-muted">{join(row.transModeDesc, row.ledgerNarration)}</p>
        </div>
      ),
    },
    {
      id: "amount",
      header: t("view.transactionColumns.amount"),
      align: "end",
      className: "font-semibold tabular-nums text-slate-900",
      cell: (row) => money(row.transAmount),
    },
    {
      id: "balanceAfter",
      header: t("view.transactionColumns.balanceAfter"),
      align: "end",
      className: "tabular-nums",
      cell: (row) => money(row.balanceAfter),
    },
    {
      id: "voucher",
      header: t("view.transactionColumns.voucher"),
      cell: (row) =>
        row.voucherNo || (row.voucherId != null ? String(row.voucherId) : dash),
    },
    {
      id: "status",
      header: t("view.transactionColumns.status"),
      cell: (row) => (
        <Badge tone={transactionTone(row.statusCd)} caps={false}>
          {row.statusDesc || dash}
        </Badge>
      ),
    },
  ];

  const editLink = account.isClosed ? null : (
    <Link
      href={depositAccountHref(account, "edit")}
      className="text-sm font-semibold text-brand hover:underline"
    >
      {t("view.manage")}
    </Link>
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionTabs tabs={tabs} activeId={tab} onChange={setTab} label={t("view.title")} />

      {tab === "overview" ? (
        <dl className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label={t("view.product")} value={account.prodTypeDesc || dash} />
          <Fact label={t("view.scheme")} value={join(account.schemeCode, account.schemeName)} />
          <Fact
            label={t("view.roi")}
            value={
              (account.sbRoi ?? account.schemeRoiPercent) == null
                ? dash
                : t("roiPercent", {
                    value: format.number(account.sbRoi ?? account.schemeRoiPercent ?? 0, {
                      maximumFractionDigits: 2,
                    }),
                  })
            }
          />
          <Fact label={t("view.mode")} value={account.opModeDesc || dash} />
          <Fact label={t("view.category")} value={account.specialCatgDesc || dash} />
          <Fact label={t("view.customerType")} value={account.custTypeDesc || dash} />
          <Fact label={t("view.primary")} value={join(account.primaryName, account.primaryRefCode)} />
          <Fact label={t("view.jointHolder")} value={join(account.joint1Name, account.joint2Name)} />
          <Fact label={t("view.mobile")} value={account.primaryMobile || dash} />
          <Fact label={t("view.branch")} value={join(account.branchCode, account.branchName)} />
          <Fact label={t("view.fieldOfficer")} value={join(account.foName, account.foCode)} />
          <Fact
            label={t("view.application")}
            value={join(account.applNo, date(account.applDate))}
          />
          <Fact label={t("view.startDate")} value={date(account.startDate)} />
          <Fact label={t("view.openingDeposit")} value={money(account.openingDeposit)} />
          <Fact label={t("view.refAcNo")} value={account.refAcNo || dash} />
          <Fact label={t("view.cbsAcNo")} value={account.cbsAcNo || dash} />
          <Fact
            label={t("view.createdBy")}
            value={join(account.createdByName, date(account.createdAt))}
          />
          {account.isClosed ? (
            <Fact
              label={t("view.closeReason")}
              value={join(account.closingReason, date(account.closingDate))}
            />
          ) : null}
        </dl>
      ) : null}

      {tab === "members" ? (
        <DataTable
          title={t("view.membersTitle")}
          description={t("view.membersHint")}
          actions={
            account.isClosed ? undefined : (
              <Button
                type="button"
                variant="secondary"
                icon={RefreshCw}
                loading={syncing}
                onClick={onSyncMembers}
              >
                {t("view.syncMembers")}
              </Button>
            )
          }
          data={account.members}
          columns={memberColumns}
          getRowKey={(row) => String(row.id)}
          getRowClassName={(row) => (row.isCurrentMember ? undefined : "opacity-60")}
          emptyTitle={t("view.membersEmptyTitle")}
          emptyMessage={t("view.membersEmpty")}
          caption={t("view.membersTitle")}
        />
      ) : null}

      {tab === "nominees" ? (
        <DataTable
          title={t("view.nomineesTitle")}
          actions={editLink}
          data={account.nominees}
          columns={nomineeColumns}
          getRowKey={(row) => String(row.nomineeId)}
          emptyTitle={t("view.nomineesEmptyTitle")}
          emptyMessage={isGroup ? t("form.nominees.groupNotice") : t("view.nomineesNone")}
          caption={t("view.nomineesTitle")}
        />
      ) : null}

      {tab === "signatories" ? (
        <DataTable
          title={t("view.signatoriesTitle")}
          actions={editLink}
          data={account.signatories}
          columns={signatoryColumns}
          getRowKey={(row) => String(row.signatoryId)}
          emptyTitle={t("view.signatoriesEmptyTitle")}
          emptyMessage={t("view.signatoriesNone")}
          caption={t("view.signatoriesTitle")}
        />
      ) : null}

      {tab === "transactions" ? (
        <DataTable
          title={t("view.transactionsTitle")}
          description={
            account.transactionCount > account.transactions.length
              ? t("view.transactionsShowing", {
                  shown: account.transactions.length,
                  total: account.transactionCount,
                })
              : undefined
          }
          actions={
            <Link
              href={savingsTransactionHref(account)}
              className="text-sm font-semibold text-brand hover:underline"
            >
              {t("view.viewAll")}
            </Link>
          }
          data={account.transactions}
          columns={transactionColumns}
          getRowKey={(row) => String(row.transId)}
          emptyTitle={t("view.transactionsEmptyTitle")}
          emptyMessage={t("view.transactionsEmpty")}
          minWidth="720px"
          caption={t("view.transactionsTitle")}
        />
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-slate-600">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-800">{value}</dd>
    </div>
  );
}
