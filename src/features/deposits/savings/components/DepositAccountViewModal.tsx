"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Link } from "@/i18n/navigation";
import { TERM_DEPOSIT_TYPE } from "../deposit-account.constants";
import { parseYmd } from "../deposit-account.rules";
import {
  fetchDepositAccountView,
  syncDepositAccountMembers,
  syncTermDepositSchedule,
} from "../services/deposit-account-client";
import type {
  DepositAccount,
  DepositAccountViewData,
} from "../types/deposit-account.types";

type DepositAccountViewModalProps = {
  account: DepositAccount | null;
  onClose: () => void;
};

function statusTone(statusCd: number): BadgeTone {
  if (statusCd === 1) return "success";
  if (statusCd === 7) return "warning";
  if (statusCd === 4) return "danger";
  if (statusCd === 5 || statusCd === 6) return "amber";
  return "neutral";
}

function formatDate(
  format: ReturnType<typeof useFormatter>,
  value: string | null | undefined,
  dash: string,
) {
  if (!value) return dash;
  const parsed = parseYmd(value);
  if (!parsed) return dash;
  return format.dateTime(parsed, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DepositAccountViewModal({
  account,
  onClose,
}: DepositAccountViewModalProps) {
  const t = useTranslations("deposits.savings");
  const tTerm = useTranslations("deposits.term");
  const tTxn = useTranslations("deposits.savingsTransaction");
  const format = useFormatter();
  const [viewData, setViewData] = useState<DepositAccountViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [scheduleSyncing, setScheduleSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    setSyncNotice(null);
    if (!account?.accountId) {
      setViewData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchDepositAccountView(account.accountId, 10)
      .then((data) => {
        if (!cancelled) setViewData(data);
      })
      .catch(() => {
        if (!cancelled) setViewData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [account?.accountId]);

  const active = viewData ?? account;
  const isGroup = active?.custTypeCd === 1;
  const dash = t("dash");

  const money = (value: number | null | undefined) =>
    value == null
      ? dash
      : format.number(value, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const date = (value: string | null | undefined) => formatDate(format, value, dash);

  const accountDisplay = active?.fullAccountNo
    ? active.fullAccountNo
    : active?.accountNo != null
      ? t("view.accountNo", { accountNo: active.accountNo })
      : dash;

  async function handleSyncSchedule() {
    if (!active?.accountId) return;
    setScheduleSyncing(true);
    setSyncNotice(null);
    try {
      await syncTermDepositSchedule(active.accountId);
      const data = await fetchDepositAccountView(active.accountId, 10);
      setViewData(data);
    } catch {
      setSyncNotice(tTerm("scheduleError"));
    } finally {
      setScheduleSyncing(false);
    }
  }

  async function handleSyncMembers() {
    if (!active?.accountId) return;
    setSyncing(true);
    setSyncNotice(null);
    try {
      const res = await syncDepositAccountMembers(active.accountId);
      if (viewData) setViewData({ ...viewData, members: res.members });
      setSyncNotice(res.message);
    } catch {
      setSyncNotice(t("view.membersEmpty"));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Modal
      open={account != null}
      onClose={onClose}
      title={active?.holderName || t("view.title")}
      subtitle={
        active
          ? t("view.accountNo", { accountNo: active.accountNo ?? dash })
          : undefined
      }
      size="xl"
    >
      {active ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(active.statusCd)} caps={false}>
                {active.statusDesc || dash}
              </Badge>
              {active.custTypeDesc ? (
                <Badge tone="info" caps={false}>
                  {active.custTypeDesc}
                </Badge>
              ) : null}
              {active.isClosed ? (
                <Badge tone="neutral" caps={false}>
                  {t("closed")}
                </Badge>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <BalanceTile label={t("view.balance")} value={money(active.currentBalance)} />
              <BalanceTile
                label={t("view.available")}
                value={money(active.availableBalance)}
              />
            </div>
          </div>

          {active.nomRegd && (viewData?.nominees.length ?? active.nomineeCount) === 0 ? (
            <Alert tone="warning">{t("view.nomineeWarning")}</Alert>
          ) : null}

          {loading && !viewData ? (
            <p className="text-sm text-muted">{t("view.loading")}</p>
          ) : null}

          <Section title={t("view.sections.account")}>
            <FactGrid>
              <Fact label={t("view.fullAccount")} value={accountDisplay} mono />
              <Fact label={t("form.applNo")} value={active.applNo || dash} />
              <Fact label={t("view.applDate")} value={date(active.applDate)} />
              <Fact label={t("view.product")} value={active.prodTypeDesc || dash} />
              <Fact
                label={t("view.scheme")}
                value={
                  [active.schemeCode, active.schemeName].filter(Boolean).join(" · ") || dash
                }
              />
              <Fact label={t("view.type")} value={active.depositTypeDesc || dash} />
              <Fact label={t("view.category")} value={active.specialCatgDesc || dash} />
              <Fact label={t("view.mode")} value={active.opModeDesc || dash} />
              <Fact
                label={t("form.nominee")}
                value={active.nomRegd ? t("view.yes") : t("view.no")}
              />
            </FactGrid>
          </Section>

          {active.depositTypeCd === TERM_DEPOSIT_TYPE && active.td ? (
            <Section title={tTerm("details")}>
              <FactGrid>
                <Fact
                  label={tTerm("period")}
                  value={tTerm("periodValue", {
                    years: active.td.periodYy ?? 0,
                    months: active.td.periodMm ?? 0,
                    days: active.td.periodDd ?? 0,
                  })}
                />
                <Fact
                  label={t("view.roi")}
                  value={
                    active.td.roi == null
                      ? dash
                      : t("roiPercent", {
                          value: format.number(active.td.roi, { maximumFractionDigits: 2 }),
                        })
                  }
                />
                <Fact
                  label={tTerm("installment")}
                  value={
                    active.td.instAmount == null
                      ? dash
                      : active.td.instNo != null && active.td.instNo > 1
                        ? tTerm("columns.amountTimes", {
                            amount: money(active.td.instAmount),
                            count: active.td.instNo,
                          })
                        : money(active.td.instAmount)
                  }
                />
                <Fact label={t("view.balance")} value={money(active.td.currentBalance)} />
                <Fact label={tTerm("columns.maturity")} value={date(active.td.maturityDate)} />
                <Fact label={tTerm("maturityAmount")} value={money(active.td.maturityAmount)} />
                <Fact label={tTerm("interest")} value={money(active.td.interestPayable)} />
                <Fact
                  label={tTerm("instruction")}
                  value={active.td.maturityInstruction || dash}
                />
              </FactGrid>
            </Section>
          ) : (
          <Section title={t("view.sections.savings")}>
            <FactGrid>
              <Fact label={t("form.sb.startDate")} value={date(active.startDate)} />
              <Fact
                label={t("view.roi")}
                value={
                  (active.sbRoi ?? active.schemeRoiPercent) == null
                    ? dash
                    : t("roiPercent", {
                        value: format.number(active.sbRoi ?? active.schemeRoiPercent ?? 0, {
                          maximumFractionDigits: 2,
                        }),
                      })
                }
              />
              <Fact label={t("form.sb.opening")} value={money(active.openingDeposit)} />
              <Fact label={t("view.balance")} value={money(active.currentBalance)} />
              <Fact label={t("view.available")} value={money(active.availableBalance)} />
              <Fact label={t("form.sb.refAcNo")} value={active.refAcNo || dash} />
              <Fact label={t("form.sb.cbsAcNo")} value={active.cbsAcNo || dash} />
            </FactGrid>
          </Section>
          )}

          <Section title={t("view.sections.holders")}>
            <FactGrid>
              <Fact label={t("form.holderName")} value={active.holderName || dash} />
              <Fact
                label={t("view.primary")}
                value={join(active.primaryName, active.primaryRefCode) || dash}
              />
              <Fact label={t("view.mobile")} value={active.primaryMobile || dash} />
              {active.custIdJoint1 != null ? (
                <Fact
                  label={t("form.joint1")}
                  value={join(active.joint1Name, active.joint1RefCode) || dash}
                />
              ) : null}
              {active.custIdJoint2 != null ? (
                <Fact
                  label={t("form.joint2")}
                  value={join(active.joint2Name, active.joint2RefCode) || dash}
                />
              ) : null}
            </FactGrid>
          </Section>

          <Section title={t("view.sections.office")}>
            <FactGrid>
              <Fact
                label={t("view.branch")}
                value={join(active.branchCode, active.branchName) || dash}
              />
              <Fact
                label={t("view.fieldOfficer")}
                value={join(active.foName, active.foCode) || dash}
              />
              <Fact
                label={t("view.createdBy")}
                value={join(active.createdByName, date(active.createdAt)) || dash}
              />
            </FactGrid>
          </Section>

          {isGroup ? (
            <Section
              title={t("view.sections.members")}
              meta={t("view.members", {
                count: viewData?.members.length ?? active.memberCount ?? 0,
              })}
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  loading={syncing}
                  onClick={handleSyncMembers}
                >
                  {syncing ? t("view.syncing") : t("view.syncMembers")}
                </Button>
              }
            >
              {syncNotice ? (
                <Alert tone="info" className="mb-3 py-2 text-xs">
                  {syncNotice}
                </Alert>
              ) : null}
              {viewData && viewData.members.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="bg-surface-muted text-slate-600">
                      <tr>
                        <th className="p-2.5 font-semibold">{t("view.primary")}</th>
                        <th className="p-2.5 font-semibold">{t("view.mobile")}</th>
                        <th className="p-2.5 font-semibold">{t("view.role")}</th>
                        <th className="p-2.5 font-semibold">{t("form.sb.startDate")}</th>
                        <th className="p-2.5 text-right font-semibold">{t("view.balance")}</th>
                        <th className="p-2.5 font-semibold">{t("columns.status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-slate-800">
                      {viewData.members.map((member) => (
                        <tr key={member.id}>
                          <td className="p-2.5 font-medium">
                            {member.memberName || dash}
                            {member.memberRefCode ? (
                              <span className="block text-[11px] text-muted">
                                {member.memberRefCode}
                              </span>
                            ) : null}
                            {!member.isCurrentMember ? (
                              <span className="mt-0.5 block text-[11px] text-amber-700">
                                {t("view.formerMember")}
                              </span>
                            ) : null}
                          </td>
                          <td className="p-2.5 text-muted">{member.mobileNo || dash}</td>
                          <td className="p-2.5">{member.memberRole || dash}</td>
                          <td className="p-2.5">{date(member.openDate)}</td>
                          <td className="p-2.5 text-right font-medium tabular-nums">
                            {money(member.currentBalance)}
                          </td>
                          <td className="p-2.5">
                            <Badge
                              tone={member.acStatusCd === 1 ? "success" : "neutral"}
                              caps={false}
                            >
                              {member.acStatusDesc || dash}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  {loading ? t("view.loading") : t("view.membersEmpty")}
                </p>
              )}
            </Section>
          ) : null}

          <Section
            title={t("view.sections.nominees")}
            meta={t("view.nominees", {
              count: viewData?.nominees.length ?? active.nomineeCount,
            })}
          >
            {viewData && viewData.nominees.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {viewData.nominees.map((nominee, index) => (
                  <li
                    key={nominee.nomineeId ?? index}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-surface-muted p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {nominee.nomName || dash}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {[
                          nominee.relationDesc,
                          nominee.age != null ? String(nominee.age) : null,
                          nominee.contactNo,
                          nominee.guardianName,
                        ]
                          .filter(Boolean)
                          .join(" · ") || dash}
                      </p>
                      {nominee.address ? (
                        <p className="mt-1 text-xs text-slate-600">{nominee.address}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {nominee.sharePercent != null ? (
                        <span className="text-sm font-semibold text-brand">
                          {t("form.nominees.shareValue", { percent: nominee.sharePercent })}
                        </span>
                      ) : null}
                      <Badge tone={nominee.isActive ? "success" : "neutral"} caps={false}>
                        {nominee.isActive ? t("form.active") : t("view.no")}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                {loading
                  ? t("view.loading")
                  : t("view.nomineesEmpty", { count: active.nomineeCount })}
              </p>
            )}
          </Section>

          <Section
            title={t("view.sections.signatories")}
            meta={t("view.signatories", {
              count: viewData?.signatories.length ?? active.signatoryCount,
            })}
          >
            {viewData && viewData.signatories.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {viewData.signatories.map((signatory, index) => (
                  <li
                    key={signatory.signatoryId ?? index}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {signatory.custName || dash}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {[signatory.custRefCode, signatory.custMobile]
                          .filter(Boolean)
                          .join(" · ") || dash}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {signatory.signatoryRole ? (
                        <Badge tone="neutral" caps={false}>
                          {signatory.signatoryRole}
                        </Badge>
                      ) : null}
                      <Badge tone={signatory.isActive ? "success" : "neutral"} caps={false}>
                        {signatory.isActive ? t("form.active") : t("view.no")}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                {loading
                  ? t("view.loading")
                  : t("view.signatoriesEmpty", { count: active.signatoryCount })}
              </p>
            )}
          </Section>

          <Section
            title={t("view.sections.transactions")}
            meta={
              viewData
                ? t("view.shownOf", {
                    shown: viewData.transactions.length,
                    total: viewData.transactionCount,
                  })
                : undefined
            }
            action={
              <Link
                href={`/deposits/savings-transactions?account_id=${active.accountId}`}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                {t("view.viewAllTransactions")}
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </Link>
            }
          >
            {viewData && viewData.transactions.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-surface-muted text-slate-600">
                    <tr>
                      <th className="p-2.5 font-semibold">{tTxn("table.transNo")}</th>
                      <th className="p-2.5 font-semibold">{tTxn("table.date")}</th>
                      <th className="p-2.5 font-semibold">{tTxn("table.type")}</th>
                      <th className="p-2.5 font-semibold">{tTxn("table.mode")}</th>
                      <th className="p-2.5 text-right font-semibold">{tTxn("table.amount")}</th>
                      <th className="p-2.5 text-right font-semibold">{tTxn("table.balance")}</th>
                      <th className="p-2.5 font-semibold">{t("view.narration")}</th>
                      <th className="p-2.5 font-semibold">{t("view.voucher")}</th>
                      <th className="p-2.5 font-semibold">{tTxn("table.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-slate-800">
                    {viewData.transactions.map((tx) => (
                      <tr key={tx.transId}>
                        <td className="p-2.5 font-medium">{tx.transNo || dash}</td>
                        <td className="p-2.5">{date(tx.transDate)}</td>
                        <td className="p-2.5">
                          <span
                            className={
                              tx.transTypeCd === 1
                                ? "font-medium text-emerald-700"
                                : "font-medium text-rose-700"
                            }
                          >
                            {tx.transTypeDesc || dash}
                          </span>
                        </td>
                        <td className="p-2.5">{tx.transModeDesc || tx.transMode || dash}</td>
                        <td className="p-2.5 text-right font-medium tabular-nums">
                          {money(tx.transAmount)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums">
                          {money(tx.balanceAfter)}
                        </td>
                        <td className="max-w-[12rem] p-2.5 text-muted">
                          {tx.ledgerNarration || dash}
                        </td>
                        <td className="p-2.5">{tx.voucherNo || dash}</td>
                        <td className="p-2.5">
                          <Badge
                            tone={
                              tx.statusCd === 1
                                ? "success"
                                : tx.statusCd === 2
                                  ? "warning"
                                  : "neutral"
                            }
                            caps={false}
                          >
                            {tx.statusDesc || dash}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted">
                {loading ? t("view.loading") : t("view.transactionsEmpty")}
              </p>
            )}
          </Section>

          {active.depositTypeCd === TERM_DEPOSIT_TYPE &&
          (viewData?.rdSchedule.length ?? 0) > 0 ? (
            <Section
              title={tTerm("schedule")}
              meta={
                viewData?.scheduleSummary
                  ? tTerm("scheduleProgress", {
                      paid: viewData.scheduleSummary.paidInstallments,
                      total: viewData.scheduleSummary.totalInstallments,
                    })
                  : undefined
              }
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  disabled={scheduleSyncing}
                  onClick={handleSyncSchedule}
                >
                  {scheduleSyncing ? tTerm("refreshing") : tTerm("refresh")}
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="p-2.5 font-semibold">{tTerm("installment")}</th>
                      <th className="p-2.5 font-semibold">{tTerm("dueDate")}</th>
                      <th className="p-2.5 text-right font-semibold">{tTerm("columns.amount")}</th>
                      <th className="p-2.5 text-right font-semibold">{tTerm("paidAmount")}</th>
                      <th className="p-2.5 font-semibold">{tTerm("paidOn")}</th>
                      <th className="p-2.5 text-right font-semibold">{tTerm("daysOverdue")}</th>
                      <th className="p-2.5 font-semibold">{t("columns.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewData?.rdSchedule.map((row) => (
                      <tr key={row.scheduleId} className="border-t border-border">
                        <td className="p-2.5 font-medium">{row.instlNo}</td>
                        <td className="p-2.5">{date(row.dueDate)}</td>
                        <td className="p-2.5 text-right tabular-nums">{money(row.instlAmt)}</td>
                        <td className="p-2.5 text-right tabular-nums">{money(row.paidAmount)}</td>
                        <td className="p-2.5">{date(row.paidDate)}</td>
                        <td className="p-2.5 text-right tabular-nums">{row.daysOverdue}</td>
                        <td className="p-2.5">
                          <Badge
                            tone={
                              row.statusCd === 1
                                ? "success"
                                : row.statusCd === 3
                                  ? "danger"
                                  : row.statusCd === 2 || row.statusCd === 4
                                    ? "warning"
                                    : "neutral"
                            }
                            caps={false}
                          >
                            {row.statusDesc || dash}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}

          {active.depositTypeCd === TERM_DEPOSIT_TYPE &&
          (viewData?.misPayouts.length ?? 0) > 0 ? (
            <Section title={tTerm("payouts")}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="p-2.5 font-semibold">{tTerm("dueDate")}</th>
                      <th className="p-2.5 text-right font-semibold">{tTerm("dueAmount")}</th>
                      <th className="p-2.5 font-semibold">{tTerm("paidOn")}</th>
                      <th className="p-2.5 font-semibold">{t("view.voucher")}</th>
                      <th className="p-2.5 font-semibold">{t("columns.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewData?.misPayouts.map((row) => (
                      <tr key={row.payoutId} className="border-t border-border">
                        <td className="p-2.5">{date(row.dueDate)}</td>
                        <td className="p-2.5 text-right tabular-nums">{money(row.dueAmount)}</td>
                        <td className="p-2.5">{date(row.paidDate)}</td>
                        <td className="p-2.5">{row.voucherNo || dash}</td>
                        <td className="p-2.5">
                          <Badge tone={row.statusCd === 1 ? "success" : "neutral"} caps={false}>
                            {row.statusDesc || dash}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}

          {active.isClosed ? (
            <Section title={t("view.sections.closing")}>
              <FactGrid>
                <Fact label={t("closeDialog.date")} value={date(active.closingDate)} />
                <Fact
                  label={t("closeDialog.reason")}
                  value={active.closingReason || dash}
                />
              </FactGrid>
            </Section>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

function join(...parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" · ");
}

function Section({
  title,
  meta,
  action,
  children,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {meta ? <p className="text-xs text-muted">{meta}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function FactGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-white px-3 py-2.5">
      <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-medium break-words text-slate-900 ${mono ? "font-mono text-[13px]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function BalanceTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
